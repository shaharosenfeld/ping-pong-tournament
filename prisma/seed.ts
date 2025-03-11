import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: '8891', // בפרויקט אמיתי צריך להצפין את הסיסמה
      name: 'מנהל המערכת',
      role: 'admin'
    }
  })

  // Create players
  const players = await Promise.all([
    prisma.player.create({
      data: {
        name: 'דניאל כהן',
        email: 'daniel@example.com',
        phone: '050-1234567'
      }
    }),
    prisma.player.create({
      data: {
        name: 'יעל לוי',
        email: 'yael@example.com',
        phone: '050-7654321'
      }
    }),
    prisma.player.create({
      data: {
        name: 'משה ישראלי',
        email: 'moshe@example.com',
        phone: '050-9876543'
      }
    })
  ])

  // Create tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: 'טורניר האביב',
      description: 'טורניר פינג פונג לכבוד האביב',
      startDate: new Date(),
      status: 'active',
      players: {
        connect: players.map(player => ({ id: player.id }))
      }
    }
  })

  // Create matches
  await Promise.all([
    prisma.match.create({
      data: {
        tournamentId: tournament.id,
        player1Id: players[0].id,
        player2Id: players[1].id,
        status: 'scheduled',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000) // מחר
      }
    }),
    prisma.match.create({
      data: {
        tournamentId: tournament.id,
        player1Id: players[1].id,
        player2Id: players[2].id,
        status: 'scheduled',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // מחרתיים
      }
    })
  ])

  console.log('Database has been seeded! 🌱')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 