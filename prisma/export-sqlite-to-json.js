// סקריפט ייצוא נתונים מ-SQLite לקובץ JSON
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('שולף נתונים מה-SQLite המקומי...')
    
    // שליפת כל הנתונים
    const users = await prisma.user.findMany()
    const players = await prisma.player.findMany()
    const tournaments = await prisma.tournament.findMany()
    const matches = await prisma.match.findMany()
    const notifications = await prisma.notification.findMany()
    
    // כדי לשמור על הקשרים בין ישויות, אנו שולפים גם את טבלאות הקשר
    const playerTournamentRelations = await prisma.$queryRaw`
      SELECT * FROM "_PlayerToTournament"
    `
    
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