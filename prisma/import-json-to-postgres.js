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
        isAdmin: user.isAdmin,
        password: user.password,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      }))
    })
    
    // יבוא טורנירים
    console.log('מייבא טורנירים...')
    await prisma.tournament.createMany({
      data: tournaments.map(tournament => ({
        id: tournament.id,
        name: tournament.name,
        description: tournament.description || null,
        startDate: tournament.startDate ? new Date(tournament.startDate) : null,
        endDate: tournament.endDate ? new Date(tournament.endDate) : null,
        createdAt: new Date(tournament.createdAt),
        updatedAt: new Date(tournament.updatedAt)
      }))
    })
    
    // יבוא שחקנים
    console.log('מייבא שחקנים...')
    await prisma.player.createMany({
      data: players.map(player => ({
        id: player.id,
        name: player.name,
        email: player.email || null,
        phone: player.phone || null,
        avatarUrl: player.avatarUrl || null,
        bio: player.bio || null,
        status: player.status,
        createdAt: new Date(player.createdAt),
        updatedAt: new Date(player.updatedAt)
      }))
    })
    
    // יבוא משחקים
    console.log('מייבא משחקים...')
    await prisma.match.createMany({
      data: matches.map(match => ({
        id: match.id,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        tournamentId: match.tournamentId,
        player1Score: match.player1Score,
        player2Score: match.player2Score,
        scheduledDate: match.scheduledDate ? new Date(match.scheduledDate) : null,
        status: match.status,
        round: match.round || null,
        createdAt: new Date(match.createdAt),
        updatedAt: new Date(match.updatedAt)
      }))
    })
    
    // יבוא התראות
    console.log('מייבא התראות...')
    await prisma.notification.createMany({
      data: notifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        userId: notification.userId || null,
        createdAt: new Date(notification.createdAt),
        updatedAt: new Date(notification.updatedAt),
        type: notification.type || "GENERAL"
      }))
    })
    
    // יבוא הקשרים בין שחקנים לטורנירים
    console.log('מייבא קשרים בין שחקנים לטורנירים...')
    for (const relation of playerTournamentRelations) {
      await prisma.$executeRaw`
        INSERT INTO "_PlayerToTournament" ("A", "B") 
        VALUES (${relation.A}, ${relation.B})
      `
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