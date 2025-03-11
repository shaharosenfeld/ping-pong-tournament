const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.match.deleteMany()
  await prisma.player.deleteMany()
  await prisma.tournament.deleteMany()
  await prisma.user.deleteMany()

  console.log('Database has been reset. 🌱')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

