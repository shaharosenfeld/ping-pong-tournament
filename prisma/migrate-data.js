// סקריפט להעברת מידע ממסד נתונים SQLite מקומי למסד PostgreSQL בענן
const { PrismaClient: PrismaClientPostgres } = require('@prisma/client')
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// יצירת לקוח עבור מסד הנתונים PostgreSQL בענן
const postgresClient = new PrismaClientPostgres({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// פונקציה שמאתרת את מיקום קובץ ה-SQLite המקומי
function findSqliteDbFile() {
  const possibleLocations = [
    './prisma/dev.db',
    './dev.db',
    '../prisma/dev.db',
    '../dev.db'
  ]
  
  for (const location of possibleLocations) {
    if (fs.existsSync(location)) {
      console.log(`נמצא קובץ מסד נתונים מקומי ב: ${location}`)
      return path.resolve(location)
    }
  }
  
  throw new Error('לא נמצא קובץ מסד נתונים SQLite מקומי')
}

async function main() {
  try {
    console.log('התחלת תהליך העברת הנתונים...')
    
    // מחפשים את מיקום קובץ מסד הנתונים המקומי
    const sqliteDbPath = findSqliteDbFile()
    
    // יוצרים קובץ זמני עם הגדרות ה-SQLite
    const tempSchemaPath = path.join(__dirname, 'temp-sqlite-schema.prisma')
    const tempSchemaContent = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:${sqliteDbPath}"
}

// כאן יש להעתיק את הגדרות המודלים מהקובץ schema.prisma המקורי
${fs.readFileSync(path.join(__dirname, 'schema.prisma'), 'utf8')
  .split('\n')
  .filter(line => line.startsWith('model ') || (line.trim() !== '' && !line.includes('datasource') && !line.includes('generator') && !line.includes('provider')))
  .join('\n')}
`
    fs.writeFileSync(tempSchemaPath, tempSchemaContent)
    
    // מייצרים לקוח Prisma זמני ל-SQLite
    console.log('יוצר לקוח Prisma זמני למסד SQLite...')
    execSync(`npx prisma generate --schema=${tempSchemaPath}`, { stdio: 'inherit' })
    
    // יוצרים מופע של הלקוח הזמני
    const { PrismaClient: PrismaClientSqlite } = require('./node_modules/.prisma/client')
    const sqliteClient = new PrismaClientSqlite()
    
    // שלב 1: מוחקים את כל הנתונים הקיימים במסד PostgreSQL
    console.log('מוחק נתונים קיימים במסד PostgreSQL...')
    await postgresClient.match.deleteMany()
    await postgresClient.player.deleteMany()
    await postgresClient.tournament.deleteMany()
    await postgresClient.user.deleteMany()
    await postgresClient.notification.deleteMany()
    
    // שלב 2: שליפת כל הנתונים ממסד SQLite המקומי
    console.log('שולף נתונים ממסד SQLite המקומי...')
    
    const users = await sqliteClient.user.findMany()
    console.log(`נמצאו ${users.length} משתמשים`)
    
    const players = await sqliteClient.player.findMany()
    console.log(`נמצאו ${players.length} שחקנים`)
    
    const tournaments = await sqliteClient.tournament.findMany()
    console.log(`נמצאו ${tournaments.length} טורנירים`)
    
    const matches = await sqliteClient.match.findMany()
    console.log(`נמצאו ${matches.length} משחקים`)
    
    const notifications = await sqliteClient.notification.findMany()
    console.log(`נמצאו ${notifications.length} התראות`)
    
    // שלב 3: שמירת כל הנתונים במסד PostgreSQL החדש
    console.log('שומר נתונים במסד PostgreSQL החדש...')
    
    // הוספת משתמשים
    console.log(`מעביר ${users.length} משתמשים...`)
    for (const user of users) {
      const { id, ...userData } = user
      await postgresClient.user.create({
        data: {
          id, // שומרים על ה-ID המקורי
          ...userData
        }
      })
    }
    
    // הוספת שחקנים
    console.log(`מעביר ${players.length} שחקנים...`)
    for (const player of players) {
      const { id, tournaments, ...playerData } = player
      await postgresClient.player.create({
        data: {
          id, // שומרים על ה-ID המקורי
          ...playerData
        }
      })
    }
    
    // הוספת טורנירים
    console.log(`מעביר ${tournaments.length} טורנירים...`)
    for (const tournament of tournaments) {
      const { id, players, ...tournamentData } = tournament
      await postgresClient.tournament.create({
        data: {
          id, // שומרים על ה-ID המקורי
          ...tournamentData
        }
      })
    }
    
    // מעדכנים את הקשרים בין שחקנים לטורנירים
    console.log('מעדכן קשרים בין שחקנים לטורנירים...')
    
    // שליפת הקשרים ממסד SQLite
    const playerTournaments = await sqliteClient.$queryRaw`
      SELECT * FROM "_PlayerToTournament"
    `
    
    // עדכון הקשרים במסד PostgreSQL
    for (const pt of playerTournaments) {
      const playerId = pt.A
      const tournamentId = pt.B
      
      try {
        await postgresClient.tournament.update({
          where: { id: tournamentId },
          data: {
            players: {
              connect: { id: playerId }
            }
          }
        })
      } catch (error) {
        console.error(`שגיאה בעדכון קשר בין שחקן ${playerId} לטורניר ${tournamentId}:`, error.message)
      }
    }
    
    // הוספת משחקים
    console.log(`מעביר ${matches.length} משחקים...`)
    for (const match of matches) {
      const { id, ...matchData } = match
      
      try {
        await postgresClient.match.create({
          data: {
            id, // שומרים על ה-ID המקורי
            ...matchData
          }
        })
      } catch (error) {
        console.error(`שגיאה בהעברת משחק ${id}:`, error.message)
      }
    }
    
    // הוספת התראות
    console.log(`מעביר ${notifications.length} התראות...`)
    for (const notification of notifications) {
      const { id, ...notificationData } = notification
      
      try {
        await postgresClient.notification.create({
          data: {
            id, // שומרים על ה-ID המקורי
            ...notificationData
          }
        })
      } catch (error) {
        console.error(`שגיאה בהעברת התראה ${id}:`, error.message)
      }
    }
    
    // ניקוי קבצים זמניים
    console.log('מנקה קבצים זמניים...')
    fs.unlinkSync(tempSchemaPath)
    
    console.log('העברת הנתונים הושלמה בהצלחה! 🎉')
  } catch (error) {
    console.error('שגיאה בהעברת הנתונים:', error)
    process.exit(1)
  } finally {
    await postgresClient.$disconnect()
  }
}

main() 