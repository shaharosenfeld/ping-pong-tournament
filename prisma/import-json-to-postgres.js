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
      console.error(`אנא הרץ קודם את סקריפט הייצוא: node prisma/direct-export.js`)
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
    for (const user of users) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'user',
          password: user.password,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      })
    }
    
    // יבוא טורנירים
    console.log('מייבא טורנירים...')
    for (const tournament of tournaments) {
      await prisma.tournament.create({
        data: {
          id: tournament.id,
          name: tournament.name,
          description: tournament.description || null,
          startDate: tournament.startDate ? new Date(tournament.startDate) : new Date(),
          endDate: tournament.endDate ? new Date(tournament.endDate) : null,
          status: tournament.status || 'draft',
          format: tournament.format || 'knockout',
          maxPlayers: tournament.maxPlayers || 8,
          rounds: tournament.rounds || 1,
          groupCount: tournament.groupCount || null,
          advanceCount: tournament.advanceCount || null,
          location: tournament.location || null,
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
          avatar: player.avatar || null,
          initials: player.initials || null,
          level: player.level || 3,
          bio: player.bio || null,
          rating: player.rating || 1000,
          wins: player.wins || 0,
          losses: player.losses || 0,
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
          player1Score: match.player1Score || null,
          player2Score: match.player2Score || null,
          player1Game1Score: match.player1Game1Score || null,
          player2Game1Score: match.player2Game1Score || null,
          player1Game2Score: match.player1Game2Score || null,
          player2Game2Score: match.player2Game2Score || null,
          player1Game3Score: match.player1Game3Score || null,
          player2Game3Score: match.player2Game3Score || null,
          player1Wins: match.player1Wins || 0,
          player2Wins: match.player2Wins || 0,
          currentGame: match.currentGame || 1,
          round: match.round || 1,
          stage: match.stage || null,
          groupName: match.groupName || null,
          status: match.status || 'scheduled',
          date: match.date ? new Date(match.date) : null,
          bestOfThree: Boolean(match.bestOfThree),
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