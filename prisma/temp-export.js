
      // סקריפט ייצוא זמני מ-SQLite
      const { PrismaClient } = require('./generated/sqlite-client')
      const fs = require('fs')
      const path = require('path')
      
      const prisma = new PrismaClient()
      
      async function main() {
        try {
          console.log('מייצא נתונים מ-SQLite...')
          
          // שליפת כל הנתונים
          const users = await prisma.user.findMany()
          console.log(`נמצאו ${users.length} משתמשים`)
          
          const players = await prisma.player.findMany()
          console.log(`נמצאו ${players.length} שחקנים`)
          
          const tournaments = await prisma.tournament.findMany()
          console.log(`נמצאו ${tournaments.length} טורנירים`)
          
          const matches = await prisma.match.findMany()
          console.log(`נמצאו ${matches.length} משחקים`)
          
          const notifications = await prisma.notification.findMany()
          console.log(`נמצאו ${notifications.length} התראות`)
          
          // שליפת הקשרים בין שחקנים לטורנירים
          const playerTournamentRelations = await prisma.$queryRaw`
            SELECT * FROM "_PlayerToTournament"
          `
          console.log(`נמצאו ${playerTournamentRelations.length} קשרים בין שחקנים לטורנירים`)
          
          // יצירת אובייקט עם כל הנתונים
          const exportData = {
            users,
            players,
            tournaments,
            matches,
            notifications,
            playerTournamentRelations
          }
          
          // כתיבה לקובץ JSON
          const exportPath = path.join(__dirname, 'db-export.json')
          fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2))
          
          console.log(`הייצוא הושלם בהצלחה! הנתונים נשמרו ב: ${exportPath}`)
        } catch (error) {
          console.error('שגיאה בייצוא הנתונים:', error)
          process.exit(1)
        } finally {
          await prisma.$disconnect()
        }
      }
      
      main()
    