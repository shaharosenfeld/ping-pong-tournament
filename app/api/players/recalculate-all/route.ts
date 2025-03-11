import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { createNotification, calculatePlayerLevels } from '@/lib/db'

const prisma = new PrismaClient()

// Helper function to calculate Elo rating changes
function calculateEloRatingChange(rating1: number, rating2: number, player1Won: boolean) {
  const K = 32 // Rating adjustment factor
  const expectedScore1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400))
  const actualScore1 = player1Won ? 1 : 0

  const ratingChange = Math.round(K * (actualScore1 - expectedScore1))
  
  return {
    newRating1: rating1 + ratingChange,
    newRating2: rating2 - ratingChange
  }
}

// פונקציה לחישוב נקודות בונוס לפי רמת היריב
function calculateBonusPoints(opponentLevel: number): number {
  switch (opponentLevel) {
    case 5: return 10; // בונוס גדול על ניצחון נגד שחקן ברמה 5
    case 4: return 7;  // בונוס על ניצחון נגד שחקן ברמה 4
    case 3: return 5;  // בונוס על ניצחון נגד שחקן ברמה 3
    case 2: return 3;  // בונוס קטן על ניצחון נגד שחקן ברמה 2
    case 1: return 1;  // בונוס מינימלי על ניצחון נגד שחקן ברמה 1
    default: return 0;
  }
}

export async function POST() {
  try {
    // 1. Reset all player stats to default values
    await prisma.player.updateMany({
      data: {
        wins: 0,
        losses: 0,
        rating: 1000, // Default rating
        level: 3 // Default level
      }
    })
    
    // 2. Get all completed matches
    const completedMatches = await prisma.match.findMany({
      where: {
        status: 'completed',
      },
      include: {
        player1: true,
        player2: true,
        tournament: true
      },
      orderBy: {
        date: 'asc' // Process matches in chronological order
      }
    })
    
    console.log(`Found ${completedMatches.length} completed matches to process`)
    
    // 3. Process each match to recalculate player stats
    for (const match of completedMatches) {
      // נטפל בכל הסוגים של המשחקים - רגילים ו"הטוב משלוש"
      if (match.bestOfThree) {
        // עבור משחקי "הטוב משלוש" - נעדכן כל משחק בנפרד
        const games = [
          { 
            player1Score: match.player1Game1Score, 
            player2Score: match.player2Game1Score,
            completed: match.player1Game1Score !== null && match.player2Game1Score !== null && 
                      (match.player1Game1Score > 0 || match.player2Game1Score > 0)
          },
          { 
            player1Score: match.player1Game2Score, 
            player2Score: match.player2Game2Score,
            completed: match.player1Game2Score !== null && match.player2Game2Score !== null && 
                      (match.player1Game2Score > 0 || match.player2Game2Score > 0)
          },
          { 
            player1Score: match.player1Game3Score, 
            player2Score: match.player2Game3Score,
            completed: match.player1Game3Score !== null && match.player2Game3Score !== null && 
                      (match.player1Game3Score > 0 || match.player2Game3Score > 0)
          }
        ]
        
        // עבור משחקי "הטוב משלוש", אנחנו קובעים ניצחון/הפסד אחד בלבד לפי התוצאה הסופית
        let player1RatingChange = 0
        let player2RatingChange = 0
        
        // עדכון משחקים בודדים - עובר על כל משחק ומעדכן רק דירוג
        let totalCompletedGames = 0
        for (const game of games) {
          if (game.completed) {
            totalCompletedGames++
            console.log(`Processing "best of three" game in match ${match.id}: Player1 ${game.player1Score} - Player2 ${game.player2Score}`)
            
            const player1WonGame = game.player1Score! > game.player2Score!
            
            // חישוב שינוי דירוג עם מקדם K מותאם
            const K = 16 // מקדם מותאם למשחקים בשיטת הטוב משלוש
            const expectedScore1 = 1 / (1 + Math.pow(10, (match.player2.rating - match.player1.rating) / 400))
            const actualScore1 = player1WonGame ? 1 : 0
            const ratingChange = Math.round(K * (actualScore1 - expectedScore1))
            
            player1RatingChange += ratingChange
            player2RatingChange -= ratingChange
          }
        }
        
        if (totalCompletedGames > 0) {
          // בדיקה מי ניצח את המשחק הכולל בשיטת "הטוב משלוש"
          const player1Won = (match.player1Wins || 0) > (match.player2Wins || 0)
          
          console.log(`Updating "best of three" match result: Player1 ${player1Won ? 'won' : 'lost'} (${match.player1Wins}-${match.player2Wins})`)
          
          // עדכון סטטיסטיקות כלליות - מחשיבים רק ניצחון אחד או הפסד אחד למשחק כולל
          await prisma.player.update({
            where: { id: match.player1Id },
            data: {
              wins: { increment: player1Won ? 1 : 0 },
              losses: { increment: player1Won ? 0 : 1 },
              rating: { increment: player1RatingChange }
            }
          })
          
          await prisma.player.update({
            where: { id: match.player2Id },
            data: {
              wins: { increment: player1Won ? 0 : 1 },
              losses: { increment: player1Won ? 1 : 0 },
              rating: { increment: player2RatingChange }
            }
          })
        }
      } else {
        // עבור משחקים רגילים
        if (match.player1Score === null || match.player2Score === null) continue
        
        const player1Won = match.player1Score > match.player2Score
        
        // עדכון ניצחונות והפסדים
        await Promise.all([
          prisma.player.update({
            where: { id: match.player1Id },
            data: {
              wins: player1Won ? { increment: 1 } : undefined,
              losses: !player1Won ? { increment: 1 } : undefined
            }
          }),
          prisma.player.update({
            where: { id: match.player2Id },
            data: {
              wins: !player1Won ? { increment: 1 } : undefined,
              losses: player1Won ? { increment: 1 } : undefined
            }
          })
        ])
        
        // חישוב שינוי דירוג Elo עם התחשבות ברמת היריב
        const { newRating1, newRating2 } = calculateEloRatingChange(
          match.player1.rating,
          match.player2.rating,
          player1Won
        )
        
        // בונוס נוסף לפי רמת היריב
        const bonusPlayer1 = player1Won ? calculateBonusPoints(match.player2.level) : 0
        const bonusPlayer2 = !player1Won ? calculateBonusPoints(match.player1.level) : 0
        
        await Promise.all([
          prisma.player.update({
            where: { id: match.player1Id },
            data: { 
              rating: newRating1 + bonusPlayer1 
            }
          }),
          prisma.player.update({
            where: { id: match.player2Id },
            data: { 
              rating: newRating2 + bonusPlayer2 
            }
          })
        ])
      }
    }
    
    // 4. Calculate player levels based on ratings
    await calculatePlayerLevels()
    
    // 5. עדכון בונוסים לפי מיקום בטורנירים
    const completedTournaments = await prisma.tournament.findMany({
      where: { status: 'completed' },
      include: {
        matches: {
          include: {
            player1: true,
            player2: true
          }
        },
        players: true
      }
    })
    
    console.log(`Found ${completedTournaments.length} completed tournaments to process`)
    
    // עדכון דירוג לפי טורנירים (ביצוע אחרי עדכון כל המשחקים הבודדים)
    for (const tournament of completedTournaments) {
      try {
        const { updatePlayerRankings } = await import('@/lib/db')
        await updatePlayerRankings(tournament.id)
        console.log(`Updated rankings for tournament ${tournament.id} (${tournament.name})`)
      } catch (error) {
        console.error(`Error updating rankings for tournament ${tournament.id}:`, error)
      }
    }
    
    // Create notification
    await createNotification({
      title: 'נתוני שחקנים עודכנו',
      message: 'כל נתוני השחקנים חושבו מחדש על פי שיטת הדירוג המשופרת',
      type: 'admin'
    })
    
    return NextResponse.json({ success: true, message: "כל נתוני השחקנים חושבו מחדש בהצלחה" })
  } catch (error) {
    console.error('Error recalculating player stats:', error)
    return NextResponse.json(
      { error: 'שגיאה בחישוב נתוני השחקנים' },
      { status: 500 }
    )
  }
}

// Utility function to check if a match is the final match of a tournament
async function checkIfFinalMatch(matchId: string, tournamentId: string): Promise<boolean> {
  const tournamentMatches = await prisma.match.findMany({
    where: { 
      tournamentId,
      stage: 'knockout'
    }
  })
  
  if (tournamentMatches.length === 0) {
    // If there are no knockout matches, this might be a single match tournament
    const allMatches = await prisma.match.findMany({
      where: { tournamentId }
    })
    return allMatches.length === 1 && allMatches[0].id === matchId
  }
  
  // Find the maximum round number
  const maxRound = Math.max(...tournamentMatches.map(m => m.round))
  
  // Get the match with the highest round number (the final match)
  const finalMatch = tournamentMatches.find(m => m.round === maxRound)
  
  return finalMatch?.id === matchId
}

// Utility function to check if a match is a semi-final match
async function checkIfSemiFinalMatch(matchId: string, tournamentId: string): Promise<boolean> {
  const tournamentMatches = await prisma.match.findMany({
    where: { 
      tournamentId,
      stage: 'knockout'
    }
  })
  
  if (tournamentMatches.length <= 1) {
    return false // No semi-finals if there's only 0 or 1 match
  }
  
  // Find the maximum round number
  const maxRound = Math.max(...tournamentMatches.map(m => m.round))
  
  // A semi-final is in the second-to-last round
  const semiFinalRound = maxRound - 1
  
  // Check if this match is in the semi-final round
  const match = tournamentMatches.find(m => m.id === matchId)
  
  return match?.round === semiFinalRound
}

// Utility function to track which players have already received the group advancement bonus
const groupAdvancementBonus = new Map<string, Set<string>>() // Map<tournamentId, Set<playerId>>

async function checkIfPlayerReceivedGroupAdvancementBonus(
  playerId: string,
  tournamentId: string
): Promise<boolean> {
  // Initialize the tournament entry if it doesn't exist
  if (!groupAdvancementBonus.has(tournamentId)) {
    groupAdvancementBonus.set(tournamentId, new Set())
  }
  
  const tournamentBonus = groupAdvancementBonus.get(tournamentId)!
  
  if (tournamentBonus.has(playerId)) {
    return true // Player already received the bonus
  }
  
  // Mark that this player received the bonus
  tournamentBonus.add(playerId)
  return false
} 