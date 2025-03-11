import { PrismaClient } from '@prisma/client'
import { createUser } from './db'

const prisma = new PrismaClient()

export async function initializeDatabase() {
  try {
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })

    // If admin user doesn't exist, create it
    if (!adminUser) {
      await createUser({
        email: 'admin@example.com',
        password: '8891',
        name: 'מנהל המערכת',
        role: 'admin'
      })
      console.log('Admin user created successfully')
    }

    return true
  } catch (error) {
    console.error('Error initializing database:', error)
    return false
  }
}

