import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const [
      activeTournaments, 
      upcomingMatches, 
      totalPlayers, 
      tournamentFormats, 
      recentTournaments,
      allMatches,
      allPlayers
    ] = await Promise.all([
      prisma.tournament.count({
        where: {
          status: 'active'
        }
      }),
      prisma.match.count({
        where: {
          status: 'scheduled',
          date: {
            gte: new Date()
          }
        }
      }),
      prisma.player.count(),
      prisma.tournament.groupBy({
        by: ['format'],
        _count: true
      }),
      prisma.tournament.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          players: true,
          matches: {
            include: {
              player1: true,
              player2: true
            }
          }
        }
      }),
      prisma.match.findMany({
        include: {
          player1: true,
          player2: true,
          tournament: true
        },
        where: {
          status: 'completed'
        }
      }),
      prisma.player.findMany({
        orderBy: {
          rating: 'desc'
        }
      })
    ])

    // Calculate additional stats
    const totalMatches = allMatches.length;
    const completedMatches = allMatches.filter(match => match.status === 'completed').length;
    
    // Calculate average score
    const averageScore = allPlayers.length > 0 
      ? Math.round(allPlayers.reduce((sum, player) => sum + player.rating, 0) / allPlayers.length) 
      : 0;
    
    // Get highest rating
    const highestRating = allPlayers.length > 0 ? allPlayers[0].rating : 0;
    
    // Find most active player
    const playerMatchCounts = new Map();
    
    allMatches.forEach(match => {
      const p1Id = match.player1Id;
      const p2Id = match.player2Id;
      
      playerMatchCounts.set(p1Id, (playerMatchCounts.get(p1Id) || 0) + 1);
      playerMatchCounts.set(p2Id, (playerMatchCounts.get(p2Id) || 0) + 1);
    });
    
    let mostActivePlayerId = '';
    let mostMatches = 0;
    
    playerMatchCounts.forEach((count, playerId) => {
      if (count > mostMatches) {
        mostMatches = count;
        mostActivePlayerId = playerId;
      }
    });
    
    // מוודא שיש שחקן פעיל תקין
    let mostActivePlayer = {
      name: '',
      matches: 0
    };
    
    if (mostActivePlayerId && allPlayers.find(p => p.id === mostActivePlayerId)) {
      const player = allPlayers.find(p => p.id === mostActivePlayerId);
      mostActivePlayer = {
        name: player?.name || '',
        matches: mostMatches
      };
    } else if (allPlayers.length > 0) {
      // אם אין שחקן פעיל, נשתמש בשחקן הראשון כברירת מחדל
      mostActivePlayer = {
        name: allPlayers[0].name,
        matches: playerMatchCounts.get(allPlayers[0].id) || 0
      };
    }

    // Score distribution analysis
    const scoreDistribution: Record<string, number> = {};
    const allScores: number[] = [];
    
    // Collect all scores
    allMatches.forEach(match => {
      if (match.status === 'completed' && match.player1Score !== null && match.player2Score !== null) {
        const scoreKey = `${match.player1Score}-${match.player2Score}`;
        scoreDistribution[scoreKey] = (scoreDistribution[scoreKey] || 0) + 1;
        allScores.push(match.player1Score, match.player2Score);
      }
    });
    
    // Find most common score
    let mostCommonScore = '';
    let maxCount = 0;
    Object.entries(scoreDistribution).forEach(([score, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonScore = score;
      }
    });
    
    // Format score distribution for display
    const formattedScoreDistribution = Object.entries(scoreDistribution)
      .map(([score, count]) => ({
        score,
        count,
        percentage: Math.round((count / totalMatches) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 most common scores
    
    // Calculate highest score in a match
    const highestScore = Math.max(...allScores.filter(score => typeof score === 'number')) || 0;

    const formatStats = {
      knockout: 0,
      league: 0,
      groups: 0
    }

    // Format tournament stats
    tournamentFormats.forEach((format: { format: string; _count: number }) => {
      if (format.format in formatStats) {
        formatStats[format.format as keyof typeof formatStats] = format._count
      }
    })

    // עיבוד הטורנירים האחרונים
    const processedTournaments = recentTournaments.map(tournament => {
      // חישוב מספר המשחקים שהושלמו
      const completedMatches = tournament.matches.filter(match => match.status === 'completed').length;
      
      // מציאת המנצח (אם יש)
      let winner = null;
      let runnerUp = null;
      
      if (tournament.format === 'knockout' && tournament.status === 'completed') {
        // בטורניר נוקאאוט, המנצח הוא מי שניצח במשחק האחרון
        const finalMatch = tournament.matches.find(match => 
          match.status === 'completed' && 
          match.round === Math.max(...tournament.matches.map(m => m.round))
        );
        
        if (finalMatch) {
          if (finalMatch.player1Score !== null && finalMatch.player2Score !== null) {
            if (finalMatch.player1Score > finalMatch.player2Score) {
              winner = finalMatch.player1.name;
              runnerUp = finalMatch.player2.name;
            } else {
              winner = finalMatch.player2.name;
              runnerUp = finalMatch.player1.name;
            }
          }
        }
      } else if (tournament.format === 'league' && tournament.matches.length > 0) {
        // בטורניר ליגה, המנצח הוא מי שיש לו הכי הרבה נצחונות
        const playerStats = new Map();
        
        tournament.players.forEach(player => {
          playerStats.set(player.id, { 
            name: player.name, 
            wins: 0, 
            points: 0 
          });
        });
        
        tournament.matches.forEach(match => {
          if (match.status === 'completed' && match.player1Score !== null && match.player2Score !== null) {
            if (match.player1Score > match.player2Score) {
              const stats = playerStats.get(match.player1Id);
              if (stats) {
                stats.wins += 1;
                stats.points += 3;
              }
            } else if (match.player2Score > match.player1Score) {
              const stats = playerStats.get(match.player2Id);
              if (stats) {
                stats.wins += 1;
                stats.points += 3;
              }
            } else {
              // תיקו
              const stats1 = playerStats.get(match.player1Id);
              const stats2 = playerStats.get(match.player2Id);
              if (stats1) stats1.points += 1;
              if (stats2) stats2.points += 1;
            }
          }
        });
        
        // מיון לפי נקודות
        const sortedPlayers = Array.from(playerStats.values()).sort((a, b) => b.points - a.points);
        
        if (sortedPlayers.length > 0) {
          winner = sortedPlayers[0].name;
          if (sortedPlayers.length > 1) {
            runnerUp = sortedPlayers[1].name;
          }
        }
      }
      
      return {
        id: tournament.id,
        name: tournament.name,
        date: tournament.startDate.toISOString().split('T')[0],
        status: tournament.status,
        format: tournament.format,
        players: tournament.players.length,
        matches: tournament.matches.length,
        completedMatches,
        winner,
        runnerUp
      };
    });

    // הכנת נתונים בסיסיים
    return NextResponse.json({
      activeTournaments,
      upcomingMatches,
      totalPlayers,
      formatStats,
      recentTournaments: processedTournaments,
      totalMatches,
      completedMatches,
      averageScore,
      highestRating,
      mostActivePlayer,
      // מידע על משחקים
      matchStats: {
        totalMatches,
        avgScore: allScores.length > 0 ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length) : 0,
        highestScore,
        mostCommonScore,
        scoreDistribution: formattedScoreDistribution,
        totalPlayers,
        averageScore,
        mostActivePlayer
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
} 