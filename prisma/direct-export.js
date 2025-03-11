// סקריפט ייצוא ישיר מ-SQLite באמצעות sqlite3
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// נתיב לקובץ ה-SQLite
const dbPath = path.resolve(__dirname, './dev.db');
console.log(`מנסה להתחבר למסד נתונים ב: ${dbPath}`);

// בדיקה שהקובץ קיים
if (!fs.existsSync(dbPath)) {
  console.error(`שגיאה: קובץ מסד הנתונים לא נמצא ב: ${dbPath}`);
  process.exit(1);
}

// יצירת חיבור למסד הנתונים
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('שגיאה בפתיחת מסד הנתונים:', err.message);
    process.exit(1);
  }
  console.log('התחברות למסד הנתונים הצליחה');
});

// פונקציה לביצוע שאילתה
function runQuery(query) {
  return new Promise((resolve, reject) => {
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

async function main() {
  try {
    console.log('מייצא נתונים מ-SQLite...');
    
    // שליפת כל הנתונים
    const users = await runQuery('SELECT * FROM User');
    console.log(`נמצאו ${users.length} משתמשים`);
    
    const players = await runQuery('SELECT * FROM Player');
    console.log(`נמצאו ${players.length} שחקנים`);
    
    const tournaments = await runQuery('SELECT * FROM Tournament');
    console.log(`נמצאו ${tournaments.length} טורנירים`);
    
    const matches = await runQuery('SELECT * FROM Match');
    console.log(`נמצאו ${matches.length} משחקים`);
    
    const notifications = await runQuery('SELECT * FROM Notification');
    console.log(`נמצאו ${notifications.length} התראות`);
    
    // שליפת הקשרים בין שחקנים לטורנירים
    const playerTournamentRelations = await runQuery('SELECT * FROM "_PlayerToTournament"');
    console.log(`נמצאו ${playerTournamentRelations.length} קשרים בין שחקנים לטורנירים`);
    
    // יצירת אובייקט עם כל הנתונים
    const exportData = {
      users,
      players,
      tournaments,
      matches,
      notifications,
      playerTournamentRelations
    };
    
    // כתיבה לקובץ JSON
    const exportPath = path.join(__dirname, 'db-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log(`הייצוא הושלם בהצלחה! הנתונים נשמרו ב: ${exportPath}`);
  } catch (error) {
    console.error('שגיאה בייצוא הנתונים:', error);
    process.exit(1);
  } finally {
    // סגירת החיבור למסד הנתונים
    db.close((err) => {
      if (err) {
        console.error('שגיאה בסגירת מסד הנתונים:', err.message);
      } else {
        console.log('החיבור למסד הנתונים נסגר');
      }
    });
  }
}

main(); 