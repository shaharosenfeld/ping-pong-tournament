// סקריפט מרכזי להעברת נתונים מ-SQLite ל-PostgreSQL
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
  
  // גיבוי ה-DATABASE_URL המקורי
  const originalDatabaseUrl = process.env.DATABASE_URL
  
  try {
    // שלב 1: זיהוי מיקום קובץ ה-SQLite המקומי
    console.log('שלב 1: מחפש את קובץ ה-SQLite המקומי...')
    
    const possibleDbPaths = [
      'dev.db',
      'prisma/dev.db',
      '.prisma/dev.db',
      'prisma/data.db',
      '../dev.db'
    ]
    
    let sqliteDbPath = null
    for (const dbPath of possibleDbPaths) {
      const fullPath = path.resolve(__dirname, dbPath)
      if (fs.existsSync(fullPath)) {
        sqliteDbPath = fullPath
        break
      }
    }
    
    if (!sqliteDbPath) {
      console.error('לא נמצא קובץ SQLite מקומי. אנא ודא שהקובץ dev.db קיים באחד מהנתיבים הבאים:')
      possibleDbPaths.forEach(p => console.log(`- ${path.resolve(__dirname, p)}`))
      process.exit(1)
    }
    
    console.log(`נמצא קובץ SQLite ב: ${sqliteDbPath}`)
    
    // שלב 2: עדכון ה-DATABASE_URL לשימוש ב-SQLite המקומי
    console.log('שלב 2: מעדכן משתנה סביבה לייצוא נתונים מ-SQLite...')
    process.env.DATABASE_URL = `file:${sqliteDbPath}`
    
    // שלב 3: ייצוא הנתונים מ-SQLite ל-JSON
    console.log('שלב 3: מייצא נתונים מ-SQLite ל-JSON...')
    execSync('node prisma/export-sqlite-to-json.js', { stdio: 'inherit' })
    
    // שלב 4: החזרת ה-DATABASE_URL המקורי (PostgreSQL)
    console.log('שלב 4: מחזיר משתנה סביבה למסד PostgreSQL...')
    process.env.DATABASE_URL = originalDatabaseUrl
    
    // שלב 5: ייבוא הנתונים מ-JSON ל-PostgreSQL
    console.log('שלב 5: מייבא נתונים ל-PostgreSQL...')
    execSync('node prisma/import-json-to-postgres.js', { stdio: 'inherit' })
    
    console.log('✅ תהליך העברת הנתונים הושלם בהצלחה!')
    console.log('הנתונים הועברו מה-SQLite המקומי ל-PostgreSQL בענן.')
    
  } catch (error) {
    console.error('שגיאה בתהליך העברת הנתונים:', error)
    process.exit(1)
  }
}

main() 