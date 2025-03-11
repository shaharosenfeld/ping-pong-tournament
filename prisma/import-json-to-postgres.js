// סקריפט ייבוא נתונים מ-JSON ל-PostgreSQL
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
require('dotenv').config() // טעינת משתני סביבה

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('מתחיל ייבוא נתונים ל-PostgreSQL...')
    
    // קריאת נתונים מקובץ JSON
    const exportPath = path.join(__dirname, 'db-export.json')
    if (!fs.existsSync(exportPath)) {
      console.error(`קובץ הייצוא לא נמצא: ${exportPath}`)
      console.error(`אנא הרץ קודם את סקריפט הייצוא: node prisma/export-sqlite-to-json.js`)
      process.exit(1)
    }
    
    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'))
    const { users, players, tournaments, matches, notifications, playerTournamentRelations } = exportData
    
    console.log(`נמצאו: ${users.length} משתמשים, ${players.length} שחקנים, ${tournaments.length} טורנירים, ${matches.length} משחקים, ${notifications.length} התראות`)
    
    // ניקוי הנתונים הקיימים
    console.log('מוחק נתונים קיימים...')
    await prisma.notification.deleteMany({})
    await prisma.match.deleteMany({})
    await prisma.player.deleteMany({})
    await prisma.tournament.deleteMany({})
    await prisma.user.deleteMany({})
    
    // יבוא משתמשים
    console.log('מייבא משתמשים...')
    await prisma.user.createMany({
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.role === 'admin' ? true : false, // המרה מ-role לשדה isAdmin
        password: user.password,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      }))
    })
    
    // יבוא טורנירים
    console.log('מייבא טורנירים...')
    for (const tournament of tournaments) {
      await prisma.tournament.create({
        data: {
          id: tournament.id,
          name: tournament.name,
          description: tournament.description || null,
          startDate: tournament.startDate ? new Date(tournament.startDate) : null,
          endDate: tournament.endDate ? new Date(tournament.endDate) : null,
          createdAt: new Date(tournament.createdAt),
          updatedAt: new Date(tournament.updatedAt)
        }
      })
    }
    
    // יבוא שחקנים
    console.log('מייבא שחקנים...')
    for (const player of players) {
      await prisma.player.create({
        data: {
          id: player.id,
          name: player.name,
          email: player.email || null,
          phone: player.phone || null,
          avatarUrl: player.avatar || null, // המרה מ-avatar לשדה avatarUrl
          bio: player.bio || null,
          status: "ACTIVE", // קבוע עבור ה-PostgreSQL
          createdAt: new Date(player.createdAt),
          updatedAt: new Date(player.updatedAt)
        }
      })
    }
    
    // יבוא הקשרים בין שחקנים לטורנירים
    console.log('מייבא קשרים בין שחקנים לטורנירים...')
    for (const relation of playerTournamentRelations) {
      await prisma.player.update({
        where: { id: relation.A },
        data: {
          tournaments: {
            connect: { id: relation.B }
          }
        }
      })
    }
    
    // יבוא משחקים
    console.log('מייבא משחקים...')
    for (const match of matches) {
      await prisma.match.create({
        data: {
          id: match.id,
          player1Id: match.player1Id,
          player2Id: match.player2Id,
          tournamentId: match.tournamentId,
          player1Score: match.player1Score || 0,
          player2Score: match.player2Score || 0,
          scheduledDate: match.date ? new Date(match.date) : null, // המרה מ-date לשדה scheduledDate
          status: match.status === 'scheduled' ? 'SCHEDULED' : 
                  match.status === 'in_progress' ? 'IN_PROGRESS' : 
                  match.status === 'completed' ? 'COMPLETED' : 'SCHEDULED',
          round: match.round || null,
          createdAt: new Date(match.createdAt),
          updatedAt: new Date(match.updatedAt)
        }
      })
    }
    
    // יבוא התראות
    console.log('מייבא התראות...')
    for (const notification of notifications) {
      await prisma.notification.create({
        data: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          read: notification.read,
          type: notification.type || "GENERAL",
          createdAt: new Date(notification.createdAt),
          updatedAt: new Date(notification.updatedAt)
        }
      })
    }
    
    console.log('הייבוא הושלם בהצלחה!')
  } catch (error) {
    console.error('שגיאה בייבוא הנתונים:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 