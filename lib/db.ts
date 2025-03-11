import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// User functions
export async function createUser(data: { email: string; password: string; name?: string; role?: string }) {
  return prisma.user.create({ data })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function updateUser(id: string, data: { name?: string; role?: string }) {
  return prisma.user.update({ where: { id }, data })
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } })
}

// Tournament functions
export async function createTournament(data: {
  name: string
  description?: string
  startDate: Date
  endDate?: Date
  status?: string
  format?: string
  maxPlayers?: number
  rounds?: number
  location?: string
}) {
  return prisma.tournament.create({ data })
}

export async function getTournaments() {
  return prisma.tournament.findMany({
    include: {
      players: true,
      matches: true,
    },
  })
}

export async function getTournament(id: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        players: true,
        matches: {
          include: {
            player1: true,
            player2: true,
          },
        },
      },
    })
    
    return tournament
  } catch (error) {
    console.error("Error fetching tournament:", error)
    throw error
  }
}

export async function updateTournament(id: string, data: {
  name?: string
  description?: string
  startDate?: Date
  endDate?: Date
  status?: string
}) {
  return prisma.tournament.update({ where: { id }, data })
}

export async function deleteTournament(id: string) {
  return prisma.tournament.delete({ where: { id } })
}

// Player functions
export async function createPlayer(data: {
  name: string
  email?: string
  phone?: string
}) {
  return prisma.player.create({ data })
}

export async function getPlayers() {
  return prisma.player.findMany({
    include: {
      tournaments: true,
    },
  })
}

export async function getPlayer(id: string) {
  return prisma.player.findUnique({
    where: { id },
    include: {
      tournaments: true,
      matchesAsP1: {
        include: {
          player2: true,
          tournament: true,
        },
      },
      matchesAsP2: {
        include: {
          player1: true,
          tournament: true,
        },
      },
    },
  })
}

export async function updatePlayer(id: string, data: {
  name?: string
  email?: string
  phone?: string
}) {
  return prisma.player.update({ where: { id }, data })
}

export async function deletePlayer(id: string) {
  return prisma.player.delete({ where: { id } })
}

// Match functions
export async function createMatch(data: {
  tournamentId: string
  player1Id: string
  player2Id: string
  date?: Date
  status?: string
}) {
  return prisma.match.create({ data })
}

export async function getMatches() {
  return prisma.match.findMany({
    include: {
      tournament: true,
      player1: true,
      player2: true,
    },
  })
}

export async function getMatch(id: string) {
  return prisma.match.findUnique({
    where: { id },
    include: {
      tournament: true,
      player1: true,
      player2: true,
    },
  })
}

export async function updateMatch(id: string, data: {
  player1Score?: number
  player2Score?: number
  status?: string
  date?: Date
}) {
  return prisma.match.update({ where: { id }, data })
}

export async function deleteMatch(id: string) {
  return prisma.match.delete({ where: { id } })
}

// Notification functions
export async function createNotification(data: {
  title: string
  message: string
  type: string
}) {
  return prisma.notification.create({ data })
}

export async function getNotifications() {
  return prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function markNotificationAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { read: true },
  })
}

export async function markAllNotificationsAsRead() {
  return prisma.notification.updateMany({
    where: { read: false },
    data: { read: true },
  })
}

export async function deleteNotification(id: string) {
  return prisma.notification.delete({ where: { id } })
}

// Data cleanup function
export async function cleanupData() {
  await prisma.match.deleteMany()
  await prisma.player.deleteMany()
  await prisma.tournament.deleteMany()
  await prisma.notification.deleteMany()
  return { success: true }
}

// Add players to tournament function
export async function addPlayersToTournament(tournamentId: string, playerIds: string[]) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true }
  });

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  // Connect players to tournament
  return prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      players: {
        connect: playerIds.map(id => ({ id }))
      }
    },
    include: { players: true }
  });
}

// Rating and level calculation functions
export async function calculatePlayerLevels() {
  // Get all players ordered by rating
  const players = await prisma.player.findMany({
    orderBy: {
      rating: 'desc'
    }
  });

  const totalPlayers = players.length;
  if (totalPlayers === 0) return;

  // שינוי מערכת הרמות - מעבר לשיטת אחוזונים
  // כל שחקן מקבל רמה בהתאם לאחוזון היחסי שלו בקרב כל השחקנים
  const updatePromises = players.map((player, index) => {
    // חישוב אחוזון השחקן (100% = הכי טוב, 0% = הכי פחות טוב)
    const percentile = 100 - (index / totalPlayers * 100);
    
    // שיטה חדשה לחלוקת כוכבים לפי אחוזונים - 20% לכל רמה
    let level = 1; // ברירת מחדל
    
    if (percentile >= 80) { // 20% עליונים
      level = 5; // 5 כוכבים - שחקן מקצועי
    } else if (percentile >= 60) { // 20% הבאים
      level = 4; // 4 כוכבים - שחקן מתקדם
    } else if (percentile >= 40) { // 20% הבאים
      level = 3; // 3 כוכבים - שחקן בינוני
    } else if (percentile >= 20) { // 20% הבאים
      level = 2; // 2 כוכבים - שחקן מתחיל
    } else { // 20% תחתונים
      level = 1; // כוכב אחד - שחקן מתחיל חדש
    }
    
    // עדכון רמת השחקן
    return prisma.player.update({
      where: { id: player.id },
      data: { level }
    });
  });

  // Execute all updates
  await Promise.all(updatePromises);
}

// Update a single player's level based on their rating
export async function updatePlayerLevel(playerId: string) {
  // פונקציה זו צריכה להשתמש בשיטת האחוזונים
  // נשתמש בפונקציה הכללית calculatePlayerLevels במקום עדכון שחקן בודד
  // כי צריך לחשב את האחוזון ביחס לכל השחקנים
  
  // בדיקה שהשחקן קיים
  const player = await prisma.player.findUnique({
    where: { id: playerId }
  });

  if (!player) return;
  
  // מעדכנים את כל רמות השחקנים כדי לשמור על מערכת האחוזונים מסונכרנת
  await calculatePlayerLevels();
}

// Helper function to calculate Elo rating change
function calculateEloRatingChange(rating1: number, rating2: number, player1Won: boolean): {
  rating1Change: number;
  rating2Change: number;
} {
  const K = 32; // Rating adjustment factor
  const expectedScore1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
  const actualScore1 = player1Won ? 1 : 0;

  const rating1Change = Math.round(K * (actualScore1 - expectedScore1));
  
  return {
    rating1Change,
    rating2Change: -rating1Change
  };
}

// New function to update player rankings based on tournament performance
export async function updatePlayerRankings(tournamentId: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        matches: {
          include: {
            player1: true,
            player2: true
          }
        },
        players: true
      }
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Only update rankings for completed tournaments
    if (tournament.status !== 'completed') {
      return;
    }

    // Track all rating changes to apply at once
    const playerUpdates: Record<string, { 
      ratingChange: number, 
      wins: number, 
      losses: number,
      tournamentPosition: number | null,
      winRate: number,
      avgOpponentLevel: number,
      matchesPlayed: number,
      pointsScored: number,
      pointsConceded: number
    }> = {};

    // Initialize player records
    tournament.players.forEach(player => {
      playerUpdates[player.id] = { 
        ratingChange: 0, 
        wins: 0, 
        losses: 0,
        tournamentPosition: null,
        winRate: 0,
        avgOpponentLevel: 0,
        matchesPlayed: 0,
        pointsScored: 0,
        pointsConceded: 0
      };
    });

    // Process all completed matches for stats
    tournament.matches.forEach(match => {
      if (match.status === 'completed' && match.player1Score !== null && match.player2Score !== null) {
        const player1Id = match.player1Id;
        const player2Id = match.player2Id;
        
        // עדכון סטטיסטיקות משחקים ונקודות
        playerUpdates[player1Id].matchesPlayed += 1;
        playerUpdates[player2Id].matchesPlayed += 1;
        
        playerUpdates[player1Id].pointsScored += match.player1Score;
        playerUpdates[player1Id].pointsConceded += match.player2Score;
        
        playerUpdates[player2Id].pointsScored += match.player2Score;
        playerUpdates[player2Id].pointsConceded += match.player1Score;
        
        // עדכון רמת יריב ממוצעת
        playerUpdates[player1Id].avgOpponentLevel += match.player2.level;
        playerUpdates[player2Id].avgOpponentLevel += match.player1.level;
      }
    });

    // חישוב ממוצעים סופיים
    Object.keys(playerUpdates).forEach(playerId => {
      const stats = playerUpdates[playerId];
      if (stats.matchesPlayed > 0) {
        stats.avgOpponentLevel = Math.round(stats.avgOpponentLevel / stats.matchesPlayed);
        stats.winRate = Math.round((stats.wins / stats.matchesPlayed) * 100);
      }
    });

    // Add tournament bonus points based on performance
    if (tournament.format === 'league') {
      // For league format: Calculate points based on wins/losses to determine positions
      const playerPoints: Record<string, number> = {};
      
      // Calculate league points (3 for win, 1 for draw)
      tournament.matches.forEach(match => {
        if (match.status === 'completed' && match.player1Score !== null && match.player2Score !== null) {
          const player1Id = match.player1Id;
          const player2Id = match.player2Id;
          
          if (match.player1Score > match.player2Score) {
            playerPoints[player1Id] = (playerPoints[player1Id] || 0) + 3;
            playerUpdates[player1Id].wins += 1;
            playerUpdates[player2Id].losses += 1;
          } else if (match.player2Score > match.player1Score) {
            playerPoints[player2Id] = (playerPoints[player2Id] || 0) + 3;
            playerUpdates[player2Id].wins += 1;
            playerUpdates[player1Id].losses += 1;
          } else {
            playerPoints[player1Id] = (playerPoints[player1Id] || 0) + 1;
            playerPoints[player2Id] = (playerPoints[player2Id] || 0) + 1;
          }
        }
      });
      
      // Sort players by points (higher is better)
      const playerRankings = Object.entries(playerPoints).sort((a, b) => b[1] - a[1]);
      
      // שמירת מיקום בטורניר ותוספת בונוס דירוג מוגדל
      playerRankings.forEach(([playerId, _], index) => {
        const position = index + 1;
        playerUpdates[playerId].tournamentPosition = position;
        
        // Bonus points based on position - ערכים מוגדלים
        let bonusPoints = 0;
        const participantsCount = playerRankings.length;
        
        if (position === 1) {
          // מנצח הטורניר - בונוס משמעותי
          bonusPoints = 50 + Math.min(participantsCount * 3, 30); // בונוס בסיס + בונוס לפי מספר המשתתפים
        } 
        else if (position === 2) {
          bonusPoints = 35 + Math.min(participantsCount * 2, 20);
        } 
        else if (position === 3) {
          bonusPoints = 25 + Math.min(participantsCount, 15);
        }
        else if (position <= participantsCount * 0.25) {
          // רבע עליון
          bonusPoints = 20;
        }
        else if (position <= participantsCount * 0.5) {
          // חצי עליון
          bonusPoints = 15;
        }
        else if (position <= participantsCount * 0.75) {
          // רבע שלישי
          bonusPoints = 10;
        }
        else {
          // רבע תחתון
          bonusPoints = 5;
        }
        
        // בונוס נוסף לפי רמת היריבים הממוצעת
        bonusPoints += Math.round(playerUpdates[playerId].avgOpponentLevel * 1.5);
        
        // בונוס נוסף לפי אחוז ניצחונות
        if (playerUpdates[playerId].winRate >= 80) bonusPoints += 10;
        else if (playerUpdates[playerId].winRate >= 60) bonusPoints += 5;
        
        // Add bonus to player's rating change
        playerUpdates[playerId].ratingChange += bonusPoints;
      });
    } else if (tournament.format === 'knockout' || tournament.format === 'groups_knockout') {
      // For knockout formats
      
      // First, identify the knockout stage matches
      const knockoutMatches = tournament.matches.filter(match => 
        tournament.format === 'knockout' || match.stage === 'knockout'
      );
      
      // Determine the total number of knockout rounds in this tournament
      const rounds = knockoutMatches.length > 0
        ? Math.max(...knockoutMatches.map(m => m.round))
        : 0;
        
      if (tournament.format === 'groups_knockout') {
        // סטטיסטיקות משלב הבתים
        const groupMatches = tournament.matches.filter(match => match.stage === 'group');
        
        const playerGroupStats: Record<string, {
          played: number;
          wins: number;
          losses: number;
          points: number; // נקודות ליגה (3 לניצחון, 1 לתיקו)
          position: number | null; // מיקום בבית
        }> = {};
        
        // איתחול סטטיסטיקות שלב הבתים
        tournament.players.forEach(player => {
          playerGroupStats[player.id] = {
            played: 0,
            wins: 0,
            losses: 0,
            points: 0,
            position: null
          };
        });
        
        // עדכון סטטיסטיקות שלב הבתים
        groupMatches.forEach(match => {
          if (match.status === 'completed' && match.player1Score !== null && match.player2Score !== null) {
            const p1Id = match.player1Id;
            const p2Id = match.player2Id;
            
            playerGroupStats[p1Id].played++;
            playerGroupStats[p2Id].played++;
            
            if (match.player1Score > match.player2Score) {
              playerGroupStats[p1Id].wins++;
              playerGroupStats[p2Id].losses++;
              playerGroupStats[p1Id].points += 3;
            } else if (match.player2Score > match.player1Score) {
              playerGroupStats[p2Id].wins++;
              playerGroupStats[p1Id].losses++;
              playerGroupStats[p2Id].points += 3;
            } else {
              playerGroupStats[p1Id].points += 1;
              playerGroupStats[p2Id].points += 1;
            }
            
            // עדכון זכיות/הפסדים כלליים
            playerUpdates[p1Id].wins += match.player1Score > match.player2Score ? 1 : 0;
            playerUpdates[p1Id].losses += match.player1Score < match.player2Score ? 1 : 0;
            playerUpdates[p2Id].wins += match.player2Score > match.player1Score ? 1 : 0;
            playerUpdates[p2Id].losses += match.player2Score < match.player1Score ? 1 : 0;
          }
        });
        
        // מיון שחקנים לפי בתים וקביעת מיקום בתוך כל בית
        const groupNames = [...new Set(groupMatches.map(m => m.groupName).filter(Boolean))];
        
        groupNames.forEach(groupName => {
          if (!groupName) return;
          
          // מציאת שחקנים בבית הנוכחי
          const groupPlayersIds = new Set<string>();
          
          groupMatches.filter(m => m.groupName === groupName).forEach(match => {
            groupPlayersIds.add(match.player1Id);
            groupPlayersIds.add(match.player2Id);
          });
          
          // מיון שחקנים לפי נקודות
          const sortedGroupPlayers = [...groupPlayersIds]
            .map(id => ({ id, stats: playerGroupStats[id] }))
            .sort((a, b) => b.stats.points - a.stats.points);
          
          // קביעת מיקום בתוך הבית
          sortedGroupPlayers.forEach((player, index) => {
            playerGroupStats[player.id].position = index + 1;
          });
          
          // בונוס דירוג לפי מיקום בבית
          sortedGroupPlayers.forEach((player, index) => {
            // בונוס למקום ראשון ושני בבית (שעולים לשלב הנוק-אאוט בד"כ)
            if (index === 0) {
              playerUpdates[player.id].ratingChange += 20; // בונוס מקום ראשון בבית
            } else if (index === 1) {
              playerUpdates[player.id].ratingChange += 15; // בונוס מקום שני בבית
            } else if (index === 2) {
              playerUpdates[player.id].ratingChange += 10; // בונוס מקום שלישי בבית
            }
          });
        });
        
        // Award bonus points for advancing from group stage - בונוס מוגדל
        const advancedPlayers = new Set<string>();
        knockoutMatches.forEach(match => {
          if (match.player1Id) advancedPlayers.add(match.player1Id);
          if (match.player2Id) advancedPlayers.add(match.player2Id);
        });
        
        // Add 25 bonus points for advancing from groups
        advancedPlayers.forEach(playerId => {
          playerUpdates[playerId].ratingChange += 25;
        });
      } else {
        // עבור טורניר נוק-אאוט רגיל - עדכון ניצחונות/הפסדים
        knockoutMatches.forEach(match => {
          if (match.status === 'completed' && match.player1Score !== null && match.player2Score !== null) {
            const p1Won = match.player1Score > match.player2Score;
            
            playerUpdates[match.player1Id].wins += p1Won ? 1 : 0;
            playerUpdates[match.player1Id].losses += !p1Won ? 1 : 0;
            playerUpdates[match.player2Id].wins += !p1Won ? 1 : 0;
            playerUpdates[match.player2Id].losses += p1Won ? 1 : 0;
          }
        });
      }
      
      // בונוסים לפי התקדמות בשלב הנוק-אאוט - בונוסים מוגדלים
      
      // מציאת הזוכים בכל שלב
      const roundWinners: Record<number, string[]> = {};
      for (let round = 1; round <= rounds; round++) {
        roundWinners[round] = [];
      }
      
      // מילוי מערך המנצחים בכל סיבוב
      for (let round = 1; round <= rounds; round++) {
        const roundMatches = knockoutMatches.filter(m => m.round === round);
        
        roundMatches.forEach(match => {
          if (match.status === 'completed' && match.player1Score !== null && match.player2Score !== null) {
            const winnerId = match.player1Score > match.player2Score ? match.player1Id : match.player2Id;
            roundWinners[round].push(winnerId);
          }
        });
      }
      
      // לולאה הפוכה מהגמר לכיוון שלבים מוקדמים
      for (let round = rounds; round >= 1; round--) {
        const winners = roundWinners[round];
        const bonusAmount = calculateKnockoutBonusByRound(round, rounds);
        
        winners.forEach(winnerId => {
          playerUpdates[winnerId].ratingChange += bonusAmount;
          
          // אם זה הסיבוב האחרון (גמר), קבע את המנצח כמקום ראשון
          if (round === rounds) {
            playerUpdates[winnerId].tournamentPosition = 1;
          }
        });
      }
      
      // מציאת מפסידי הגמר (מקום 2) ומפסידי חצי הגמר (מקום 3-4)
      if (rounds >= 1) {
        const finalMatch = knockoutMatches.find(m => m.round === rounds && m.status === 'completed');
        if (finalMatch && finalMatch.player1Score !== null && finalMatch.player2Score !== null) {
          const loserId = finalMatch.player1Score > finalMatch.player2Score 
            ? finalMatch.player2Id 
            : finalMatch.player1Id;
          
          // קביעת מקום 2
          playerUpdates[loserId].tournamentPosition = 2;
          
          // בונוס למקום 2 - הגדלנו ל-40 נקודות
          playerUpdates[loserId].ratingChange += 40;
        }
      }
      
      if (rounds >= 2) {
        const semiFinalMatches = knockoutMatches.filter(m => m.round === rounds - 1 && m.status === 'completed');
        
        // מציאת המפסידים בחצי הגמר
        semiFinalMatches.forEach(match => {
          if (match.player1Score !== null && match.player2Score !== null) {
            const loserId = match.player1Score > match.player2Score 
              ? match.player2Id 
              : match.player1Id;
            
            // מפסידי חצי הגמר מקבלים מקום 3-4
            playerUpdates[loserId].tournamentPosition = 3;
            
            // בונוס למקום 3-4 - הגדלנו ל-30 נקודות
            playerUpdates[loserId].ratingChange += 30;
          }
        });
      }
    }

    // Apply all updates to players
    await Promise.all(Object.entries(playerUpdates).map(async ([playerId, updates]) => {
      await prisma.player.update({
        where: { id: playerId },
        data: {
          rating: {
            increment: updates.ratingChange
          },
          wins: {
            increment: updates.wins
          },
          losses: {
            increment: updates.losses
          }
        }
      });
      
      // Update player's level after rating change
      await updatePlayerLevel(playerId);
    }));
    
    // Create notification about updated rankings
    await createNotification({
      title: 'דירוג שחקנים עודכן',
      message: `הדירוג עודכן בהתאם לתוצאות הטורניר "${tournament.name}"`,
      type: 'system'
    });
    
    return true;
  } catch (error) {
    console.error('Error updating player rankings:', error);
    throw error;
  }
}

// פונקציית עזר לחישוב בונוס דירוג בשלב נוק-אאוט
function calculateKnockoutBonusByRound(round: number, totalRounds: number): number {
  // ערכי בונוס מוגדלים
  if (round === totalRounds) {
    return 60; // מנצח הטורניר - בונוס מאוד משמעותי
  } else if (round === totalRounds - 1) {
    return 30; // הגעה לגמר
  } else if (round === totalRounds - 2) {
    return 20; // הגעה לחצי גמר
  } else if (round === totalRounds - 3) {
    return 15; // הגעה לרבע גמר
  } else {
    return 10; // התקדמות בשלבי הנוק-אאוט המוקדמים
  }
}

// Helper function to calculate win rate percentage
export function calculateWinRate(wins: number, losses: number): number {
  if (wins + losses === 0) return 0;
  return Math.round((wins / (wins + losses)) * 100);
}

