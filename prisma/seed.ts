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

  // Create tournaments
  const tournaments = await Promise.all([
    prisma.tournament.create({
      data: {
        name: 'טורניר אליפות קיץ 2023',
        description: 'טורניר האליפות השנתי',
        startDate: new Date('2023-07-10T10:00:00'),
        endDate: new Date('2023-07-11T18:00:00'),
        format: 'knockout',
        maxPlayers: 8,
        status: 'completed',
        price: 50,
        registrationOpen: false,
        registrationDeadline: new Date('2023-07-05T23:59:59'),
        players: {
          connect: players.map(player => ({ id: player.id }))
        }
      }
    }),
    prisma.tournament.create({
      data: {
        name: 'ליגת חורף 2023',
        description: 'ליגת חורף שבועית',
        startDate: new Date('2023-12-01T18:00:00'),
        format: 'league',
        rounds: 2,
        maxPlayers: 10,
        status: 'active',
        price: 75,
        registrationOpen: true,
        registrationDeadline: new Date('2023-11-25T23:59:59'),
        players: {
          connect: players.map(player => ({ id: player.id }))
        }
      }
    })
  ])

  // Create matches
  await Promise.all([
    prisma.match.create({
      data: {
        tournamentId: tournaments[0].id,
        player1Id: players[0].id,
        player2Id: players[1].id,
        status: 'scheduled',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000) // מחר
      }
    }),
    prisma.match.create({
      data: {
        tournamentId: tournaments[0].id,
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