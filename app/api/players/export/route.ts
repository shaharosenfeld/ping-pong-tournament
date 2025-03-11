import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('Exporting player data')
    
    // שליפת כל השחקנים עם נתונים מפורטים
    const players = await prisma.player.findMany({
      include: {
        _count: {
          select: {
            matchesAsP1: {
              where: {
                status: 'completed'
              }
            },
            matchesAsP2: {
              where: {
                status: 'completed'
              }
            }
          }
        }
      },
      orderBy: {
        rating: 'desc'
      }
    })
    
    // חישוב נתונים נוספים
    const playersWithStats = players.map(player => {
      const totalMatches = player._count.matchesAsP1 + player._count.matchesAsP2
      const winRate = player.wins + player.losses > 0
        ? Math.round((player.wins / (player.wins + player.losses)) * 100)
        : 0
        
      return {
        id: player.id,
        name: player.name,
        email: player.email,
        phone: player.phone,
        avatar: player.avatar,
        initials: player.initials,
        level: player.level,
        bio: player.bio,
        wins: player.wins,
        losses: player.losses,
        rating: player.rating,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt,
        totalMatches,
        winRate,
        matchesMinusWinsLosses: totalMatches - (player.wins + player.losses),
      }
    })
    
    // שליפת כל המשחקים המושלמים
    const completedMatches = await prisma.match.findMany({
      where: {
        status: 'completed'
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true
          }
        },
        tournament: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })
    
    return NextResponse.json({
      players: playersWithStats,
      matches: completedMatches,
      exportedAt: new Date()
    })
  } catch (error) {
    console.error('Error exporting player data:', error)
    return NextResponse.json(
      { error: 'Failed to export player data', details: (error as Error).message },
      { status: 500 }
    )
  }
} 