// סקריפט להעברת נתונים מ-SQLite ל-PostgreSQL
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

async function main() {
  console.log('🚀 מתחיל תהליך העברת נתונים מ-SQLite ל-PostgreSQL')
  
  // בדיקה שה-DATABASE_URL מוגדר בקובץ .env
  if (!process.env.DATABASE_URL) {
    console.error('שגיאה: משתנה הסביבה DATABASE_URL לא מוגדר בקובץ .env')
    process.exit(1)
  }
  
  if (!process.env.DATABASE_URL.includes('postgresql')) {
    console.error('שגיאה: משתנה הסביבה DATABASE_URL חייב להיות חיבור ל-PostgreSQL')
    process.exit(1)
  }
  
  try {
    // שלב 1: איתור ויצירת ספריית פלט זמנית לקליינט ה-SQLite
    console.log('שלב 1: יוצר ספריית פלט זמנית לקליינט ה-SQLite...')
    const sqliteClientDir = path.resolve(__dirname, './generated/sqlite-client')
    
    if (!fs.existsSync(path.resolve(__dirname, './generated'))) {
      fs.mkdirSync(path.resolve(__dirname, './generated'))
    }
    
    if (!fs.existsSync(sqliteClientDir)) {
      fs.mkdirSync(sqliteClientDir)
    }
    
    // שלב 2: יצירת קליינט Prisma זמני ל-SQLite
    console.log('שלב 2: יוצר קליינט Prisma זמני ל-SQLite...')
    execSync('npx prisma generate --schema=./prisma/temp-sqlite-schema.prisma', { stdio: 'inherit' })
    
    // שלב 3: יצירת קובץ ייצוא זמני עבור SQLite
    console.log('שלב 3: יוצר סקריפט ייצוא זמני עבור SQLite...')
    
    const tempExportFile = path.resolve(__dirname, './temp-export.js')
    fs.writeFileSync(tempExportFile, `
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
          console.log(\`נמצאו \${users.length} משתמשים\`)
          
          const players = await prisma.player.findMany()
          console.log(\`נמצאו \${players.length} שחקנים\`)
          
          const tournaments = await prisma.tournament.findMany()
          console.log(\`נמצאו \${tournaments.length} טורנירים\`)
          
          const matches = await prisma.match.findMany()
          console.log(\`נמצאו \${matches.length} משחקים\`)
          
          const notifications = await prisma.notification.findMany()
          console.log(\`נמצאו \${notifications.length} התראות\`)
          
          // שליפת הקשרים בין שחקנים לטורנירים
          const playerTournamentRelations = await prisma.$queryRaw\`
            SELECT * FROM "_PlayerToTournament"
          \`
          console.log(\`נמצאו \${playerTournamentRelations.length} קשרים בין שחקנים לטורנירים\`)
          
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
          
          console.log(\`הייצוא הושלם בהצלחה! הנתונים נשמרו ב: \${exportPath}\`)
        } catch (error) {
          console.error('שגיאה בייצוא הנתונים:', error)
          process.exit(1)
        } finally {
          await prisma.$disconnect()
        }
      }
      
      main()
    `)
    
    // שלב 4: הרצת סקריפט הייצוא
    console.log('שלב 4: מריץ את סקריפט הייצוא מ-SQLite...')
    execSync('node ./prisma/temp-export.js', { stdio: 'inherit' })
    
    // שלב 5: ייבוא הנתונים ל-PostgreSQL
    console.log('שלב 5: מייבא נתונים ל-PostgreSQL...')
    execSync('node ./prisma/import-json-to-postgres.js', { stdio: 'inherit' })
    
    // שלב 6: ניקוי קבצים זמניים
    console.log('שלב 6: מנקה קבצים זמניים...')
    fs.unlinkSync(tempExportFile)
    
    console.log('✅ תהליך העברת הנתונים הושלם בהצלחה!')
    console.log('הנתונים הועברו מה-SQLite המקומי ל-PostgreSQL בענן.')
    
  } catch (error) {
    console.error('שגיאה בתהליך העברת הנתונים:', error)
    process.exit(1)
  }
}

main() 