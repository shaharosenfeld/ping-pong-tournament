const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.match.deleteMany()
  await prisma.player.deleteMany()
  await prisma.tournament.deleteMany()
  await prisma.user.deleteMany()
  await prisma.notification.deleteMany()

  console.log('Database has been reset. 🌱')

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: '$2a$10$GQf4YivxHi/hvPEqJz0ueOKswZuF7J0KHYwA7Hmj.0iyMMYTVDE3W', // password123
      name: 'מנהל המערכת',
      role: 'admin'
    }
  })
  
  // Create sample players
  const players = await Promise.all([
    prisma.player.create({
      data: {
        name: 'אבי כהן',
        email: 'avi@example.com',
        phone: '050-1234567',
        avatar: '/placeholder-user.jpg',
        initials: 'אכ',
        level: 5,
        bio: 'שחקן מקצועי עם ניסיון של 10 שנים',
        rating: 1600,
        wins: 25,
        losses: 5
      }
    }),
    prisma.player.create({
      data: {
        name: 'שירה לוי',
        email: 'shira@example.com',
        phone: '050-7654321',
        avatar: '/placeholder-user.jpg',
        initials: 'של',
        level: 4,
        bio: 'שחקנית מתקדמת',
        rating: 1450,
        wins: 15,
        losses: 8
      }
    }),
    prisma.player.create({
      data: {
        name: 'דני אלון',
        email: 'dani@example.com',
        phone: '050-9876543',
        avatar: '/placeholder-user.jpg',
        initials: 'דא',
        level: 3,
        bio: 'שחקן חובב',
        rating: 1300,
        wins: 10,
        losses: 12
      }
    }),
    prisma.player.create({
      data: {
        name: 'מיכל רוזן',
        email: 'michal@example.com',
        phone: '050-1122334',
        avatar: '/placeholder-user.jpg',
        initials: 'מר',
        level: 3,
        bio: 'שחקנית מתחילה',
        rating: 1200,
        wins: 5,
        losses: 5
      }
    })
  ])
  
  // Create sample tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: 'טורניר האביב 2024',
      description: 'טורניר פינג פונג שנתי',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-04-15'),
      status: 'active',
      format: 'knockout',
      maxPlayers: 16,
      location: 'מרכז הספורט תל אביב'
    }
  })
  
  // Add players to tournament
  await Promise.all(
    players.map(player => 
      prisma.tournament.update({
        where: { id: tournament.id },
        data: {
          players: {
            connect: { id: player.id }
          }
        }
      })
    )
  )
  
  // Create some matches
  await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      player1Id: players[0].id,
      player2Id: players[1].id,
      player1Score: 21,
      player2Score: 15,
      status: 'completed',
      date: new Date('2024-04-05'),
      round: 1
    }
  })
  
  await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      player1Id: players[2].id,
      player2Id: players[3].id,
      player1Score: 18,
      player2Score: 21,
      status: 'completed',
      date: new Date('2024-04-05'),
      round: 1
    }
  })
  
  // Create a notification
  await prisma.notification.create({
    data: {
      title: 'טורניר חדש',
      message: 'טורניר האביב 2024 נפתח להרשמה',
      type: 'tournament',
      read: false
    }
  })

  console.log('Sample data seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

