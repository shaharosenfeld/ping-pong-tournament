import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// This should match the password you want to use
const CLEANUP_PASSWORD = '8891'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    if (password !== CLEANUP_PASSWORD) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    // Delete all matches without any conditions
    const deletedMatches = await prisma.match.deleteMany()

    // Delete all tournaments without any conditions
    const deletedTournaments = await prisma.tournament.deleteMany()

    // Delete all players without any conditions
    const deletedPlayers = await prisma.player.deleteMany()

    return NextResponse.json({
      message: 'All data deleted successfully',
      stats: {
        deletedMatches: deletedMatches.count,
        deletedTournaments: deletedTournaments.count,
        deletedPlayers: deletedPlayers.count
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error during data cleanup:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    console.error('Error during data cleanup:', error)
    return NextResponse.json({ error: 'Failed to cleanup data' }, { status: 500 })
  }
} 