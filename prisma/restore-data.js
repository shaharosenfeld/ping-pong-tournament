// סקריפט לשחזור נתונים מקובץ JSON לתוך מסד הנתונים PostgreSQL
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('התחלת תהליך שחזור הנתונים...')
    
    // קריאת הנתונים מקובץ הגיבוי
    const dataFilePath = path.join(__dirname, 'db-export.json')
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'))
    
    console.log('נתונים נקראו בהצלחה מקובץ הגיבוי')
    console.log(`נמצאו ${data.players.length} שחקנים, ${data.tournaments?.length || 0} טורנירים, ` +
                `${data.matches?.length || 0} משחקים, ${data.playerTournamentRelations?.length || 0} קשרי שחקנים-טורנירים`)
    
    // מחיקת נתונים נוכחיים ממסד הנתונים
    console.log('מוחק נתונים קיימים...')
    await prisma.match.deleteMany()
    await prisma.tournamentRegistration.deleteMany() 
    await prisma.player.deleteMany()
    await prisma.tournament.deleteMany()
    await prisma.notification.deleteMany()
    
    // שחזור שחקנים
    console.log('משחזר שחקנים...')
    for (const player of data.players) {
      // המרת timestamp למבנה תאריך
      const createdAt = new Date(player.createdAt)
      const updatedAt = new Date(player.updatedAt)
      
      // מסיר שדות שלא קיימים במודל הנוכחי
      const { initials, ...playerData } = player
      
      try {
        await prisma.player.create({
          data: {
            ...playerData,
            createdAt,
            updatedAt
          }
        })
      } catch (error) {
        console.error(`שגיאה בשחזור שחקן ${player.name}:`, error.message)
      }
    }
    
    // שחזור טורנירים
    if (data.tournaments) {
      console.log('משחזר טורנירים...')
      for (const tournament of data.tournaments) {
        // המרת timestamp למבנה תאריך
        const createdAt = new Date(tournament.createdAt)
        const updatedAt = new Date(tournament.updatedAt)
        const startDate = new Date(tournament.startDate)
        const endDate = tournament.endDate ? new Date(tournament.endDate) : null
        const registrationDeadline = tournament.registrationDeadline ? new Date(tournament.registrationDeadline) : null
        
        // הסרת שדות לא רלוונטיים והמרה
        const { matches, players, registrations, ...tournamentData } = tournament
        
        // יצירת טורניר במסד הנתונים
        try {
          await prisma.tournament.create({
            data: {
              ...tournamentData,
              createdAt,
              updatedAt,
              startDate,
              endDate,
              registrationDeadline
            }
          })
        } catch (error) {
          console.error(`שגיאה בשחזור טורניר ${tournament.name}:`, error.message)
        }
      }
    }

    // שחזור קשרים בין שחקנים לטורנירים
    if (data.playerTournamentRelations) {
      console.log('משחזר קשרים בין שחקנים לטורנירים...')
      for (const relation of data.playerTournamentRelations) {
        const playerId = relation.A
        const tournamentId = relation.B
        
        try {
          await prisma.tournament.update({
            where: { id: tournamentId },
            data: {
              players: {
                connect: { id: playerId }
              }
            }
          })
        } catch (error) {
          console.error(`שגיאה בקישור שחקן ${playerId} לטורניר ${tournamentId}:`, error.message)
        }
      }
    }
    
    // שחזור משחקים
    if (data.matches) {
      console.log('משחזר משחקים...')
      for (const match of data.matches) {
        // המרת timestamp למבנה תאריך
        const createdAt = new Date(match.createdAt)
        const updatedAt = new Date(match.updatedAt)
        const date = match.date ? new Date(match.date) : null
        
        try {
          await prisma.match.create({
            data: {
              ...match,
              createdAt,
              updatedAt,
              date
            }
          })
        } catch (error) {
          console.error(`שגיאה בשחזור משחק:`, error.message)
        }
      }
    }
    
    // שחזור התראות
    if (data.notifications) {
      console.log('משחזר התראות...')
      for (const notification of data.notifications) {
        // המרת timestamp למבנה תאריך
        const createdAt = new Date(notification.createdAt)
        const updatedAt = new Date(notification.updatedAt)
        
        try {
          await prisma.notification.create({
            data: {
              ...notification,
              createdAt,
              updatedAt
            }
          })
        } catch (error) {
          console.error(`שגיאה בשחזור התראה:`, error.message)
        }
      }
    }
    
    console.log('תהליך שחזור הנתונים הושלם בהצלחה! 🎉')
  } catch (error) {
    console.error('שגיאה בתהליך שחזור הנתונים:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 