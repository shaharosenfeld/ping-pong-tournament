import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface Player {
  id: string
  name: string
  email: string | null
  phone: string | null
  rating: number
}

interface Tournament {
  id: string
  name: string
  description: string | null
  startDate: Date
  endDate: Date | null
  status: string
  format: string
  maxPlayers: number
  rounds: number
  location: string | null
}

interface Match {
  id: string
  tournamentId: string
  player1Id: string
  player2Id: string
  player1Score: number | null
  player2Score: number | null
  status: string
  date: Date | null
  createdAt: Date
  updatedAt: Date
  player1: Player
  player2: Player
  tournament: Tournament
}

export async function GET() {
  try {
    const [totalPlayers, totalTournaments, totalMatches, activeTournaments, tournamentFormats] = await Promise.all([
      prisma.player.count(),
      prisma.tournament.count(),
      prisma.match.count(),
      prisma.tournament.count({
        where: {
          status: 'active'
        }
      }),
      prisma.tournament.groupBy({
        by: ['format'],
        _count: true
      })
    ])

    const formatStats = {
      knockout: 0,
      league: 0,
      groups: 0
    }

    // Format tournament stats
    tournamentFormats.forEach((format: { format: string; _count: number }) => {
      if (format.format in formatStats) {
        formatStats[format.format as keyof typeof formatStats] = format._count
      }
    })

    // Get recent activities
    const recentActivities = await prisma.match.findMany({
      take: 5,
      orderBy: {
        date: 'desc'
      },
      include: {
        tournament: true,
        player1: true,
        player2: true
      }
    })

    // Get upcoming matches
    const upcomingMatches = await prisma.match.findMany({
      where: {
        status: 'scheduled',
        date: {
          gte: new Date()
        }
      },
      take: 5,
      orderBy: {
        date: 'asc'
      },
      include: {
        tournament: true,
        player1: true,
        player2: true
      }
    })

    return NextResponse.json({
      totalPlayers,
      totalTournaments,
      totalMatches,
      activeTournaments,
      formatStats,
      recentActivities,
      upcomingMatches
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    )
  }
} 