import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { calculatePlayerLevels, createNotification } from '@/lib/db'

const prisma = new PrismaClient()

// הגדרות טיפוסים
interface PlayerStats {
  wins: number;
  losses: number;
  rating: number;
}

interface PlayerStatsMap {
  [playerId: string]: PlayerStats;
}

export async function POST() {
  try {
    console.log('Starting complete reset and recalculation of all player statistics')
    
    // 1. Reset all player stats to default values
    await prisma.player.updateMany({
      data: {
        wins: 0,
        losses: 0,
        rating: 1000, // איפוס דירוג לברירת מחדל
        level: 1      // איפוס רמה לברירת מחדל
      }
    })
    
    console.log('All player statistics have been reset to defaults')
    
    // שליפת נתוני המשחקים עם מידע על הסוג (רגיל או best of three)
    const completedMatches = await prisma.match.findMany({
      where: {
        status: 'completed',
      },
      select: {
        id: true,
        player1Id: true,
        player2Id: true,
        player1Score: true,
        player2Score: true,
        player1Game1Score: true,
        player2Game1Score: true,
        player1Game2Score: true,
        player2Game2Score: true,
        player1Game3Score: true,
        player2Game3Score: true,
        bestOfThree: true,
        date: true,
      },
      orderBy: {
        date: 'asc' // עיבוד המשחקים בסדר כרונולוגי
      }
    })
    
    console.log(`Found ${completedMatches.length} completed matches to process`)
    
    // מידע על השחקנים ודירוגם הנוכחי
    const players = await prisma.player.findMany()
    const playerRatings = Object.fromEntries(players.map(p => [p.id, p.rating]))
    
    // מעקב אחרי סיכום סטטיסטיקות לכל שחקן
    const playerStats: PlayerStatsMap = {}
    
    // 3. עיבוד כל המשחקים לחישוב סטטיסטיקות
    for (const match of completedMatches) {
      if (!match.player1Id || !match.player2Id) continue // דילוג על משחקים ללא שחקנים
      
      // איתחול סטטיסטיקות לשחקנים אם לא קיימות
      if (!playerStats[match.player1Id]) {
        playerStats[match.player1Id] = { wins: 0, losses: 0, rating: playerRatings[match.player1Id] || 1000 }
      }
      if (!playerStats[match.player2Id]) {
        playerStats[match.player2Id] = { wins: 0, losses: 0, rating: playerRatings[match.player2Id] || 1000 }
      }
      
      if (match.bestOfThree) {
        // עבור משחקי "הטוב משלוש"
        console.log(`Processing bestOfThree match ${match.id}`)
        
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
        
        // חישוב תוצאות של כל משחק בנפרד
        let player1Wins = 0
        let player2Wins = 0
        
        // חישוב שינוי דירוג כולל
        let player1RatingChange = 0
        let player2RatingChange = 0
        
        // עיבוד כל משחק בודד
        for (const game of games) {
          if (game.completed && game.player1Score !== null && game.player2Score !== null) {
            const player1WonGame = game.player1Score > game.player2Score
            
            // חישוב שינוי דירוג עבור משחק בודד
            const K = 16 // מקדם K מופחת למשחקי הטוב משלוש
            const rating1 = playerStats[match.player1Id].rating
            const rating2 = playerStats[match.player2Id].rating
            const expectedScore1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400))
            const actualScore1 = player1WonGame ? 1 : 0
            const ratingChange = Math.round(K * (actualScore1 - expectedScore1))
            
            player1RatingChange += ratingChange
            player2RatingChange -= ratingChange
            
            // ספירת ניצחונות למשחק השלם
            if (player1WonGame) {
              player1Wins++
            } else {
              player2Wins++
            }
          }
        }
        
        // קביעת המנצח במשחק השלם
        const totalPlayer1Wins = player1Wins
        const totalPlayer2Wins = player2Wins
        
        // חישוב תוצאת המשחק השלם
        if (totalPlayer1Wins > 0 || totalPlayer2Wins > 0) {
          // ממירים את ניצחונות המשחקים הבודדים לניצחון/הפסד אחד של המשחק השלם
          if (totalPlayer1Wins > totalPlayer2Wins) {
            // שחקן 1 ניצח את המשחק השלם
            playerStats[match.player1Id].wins += 1
            playerStats[match.player2Id].losses += 1
          } else if (totalPlayer2Wins > totalPlayer1Wins) {
            // שחקן 2 ניצח את המשחק השלם
            playerStats[match.player2Id].wins += 1
            playerStats[match.player1Id].losses += 1
          }
          // במקרה של תיקו, אין שינוי בסטטיסטיקה
          
          // עדכון דירוג
          playerStats[match.player1Id].rating += player1RatingChange
          playerStats[match.player2Id].rating += player2RatingChange
          
          console.log(`Match result: Player1 ${totalPlayer1Wins}-${totalPlayer2Wins} Player2, Rating change: P1 ${player1RatingChange}, P2 ${player2RatingChange}`)
        }
      } else {
        // משחק רגיל
        if (match.player1Score !== null && match.player2Score !== null) {
          console.log(`Processing regular match ${match.id}: ${match.player1Score}-${match.player2Score}`)
          
          const player1Won = match.player1Score > match.player2Score
          
          // חישוב שינוי דירוג למשחק רגיל
          const K = 32
          const rating1 = playerStats[match.player1Id].rating
          const rating2 = playerStats[match.player2Id].rating
          const expectedScore1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400))
          const actualScore1 = player1Won ? 1 : 0
          const ratingChange = Math.round(K * (actualScore1 - expectedScore1))
          
          // עדכון סטטיסטיקות
          if (player1Won) {
            playerStats[match.player1Id].wins += 1
            playerStats[match.player2Id].losses += 1
          } else {
            playerStats[match.player2Id].wins += 1
            playerStats[match.player1Id].losses += 1
          }
          
          // עדכון דירוג
          playerStats[match.player1Id].rating += ratingChange
          playerStats[match.player2Id].rating -= ratingChange
          
          console.log(`Match result: ${player1Won ? 'Player1 won' : 'Player2 won'}, Rating change: P1 ${ratingChange}, P2 ${-ratingChange}`)
        }
      }
    }
    
    // עדכון נתוני השחקנים במסד הנתונים
    console.log('Updating player statistics in database...')
    
    for (const [playerId, stats] of Object.entries(playerStats)) {
      await prisma.player.update({
        where: { id: playerId },
        data: {
          wins: stats.wins,
          losses: stats.losses,
          rating: stats.rating
        }
      })
    }
    
    console.log('All player statistics have been updated')
    
    // 4. חישוב רמות השחקנים לפי אחוזונים
    await calculatePlayerLevels()
    console.log('Player levels have been recalculated using percentile system')
    
    // 5. יצירת התראה על איפוס וחישוב מחדש
    await createNotification({
      title: "איפוס וחישוב מחדש של נתוני שחקנים",
      message: "בוצע איפוס לכל דירוגי ונתוני השחקנים וחישוב מחדש מדויק לפי תוצאות המשחקים.",
      type: "info"
    })
    
    return NextResponse.json({
      success: true,
      message: "כל נתוני השחקנים אופסו וחושבו מחדש בהצלחה"
    })
  } catch (error) {
    console.error('Error resetting and recalculating player statistics:', error)
    return NextResponse.json(
      { error: 'Failed to reset and recalculate player statistics', details: (error as Error).message },
      { status: 500 }
    )
  }
} 