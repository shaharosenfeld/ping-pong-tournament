import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PrismaClient } from '@prisma/client'

const prismaClient = new PrismaClient()

// פונקציה להגרלת משחקים בליגה
function generateLeagueMatches(playerIds: string[], rounds: number = 1) {
  const matches = []
  
  // עבור כל סיבוב
  for (let round = 1; round <= rounds; round++) {
    // כל שחקן משחק נגד כל שחקן אחר
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        // בסיבוב השני מחליפים בין שחקן 1 לשחקן 2
        const [player1Id, player2Id] = round === 1 
          ? [playerIds[i], playerIds[j]]
          : [playerIds[j], playerIds[i]]

        matches.push({
          player1Id,
          player2Id,
          round,
        })
      }
    }
  }

  return matches
}

// פונקציה לחישוב דירוג ELO חדש
function calculateNewRatings(player1Rating: number, player2Rating: number, player1Won: boolean) {
  const K = 32 // פקטור השפעה
  const expectedScore1 = 1 / (1 + Math.pow(10, (player2Rating - player1Rating) / 400))
  const expectedScore2 = 1 - expectedScore1
  const actualScore1 = player1Won ? 1 : 0
  const actualScore2 = 1 - actualScore1

  const newRating1 = Math.round(player1Rating + K * (actualScore1 - expectedScore1))
  const newRating2 = Math.round(player2Rating + K * (actualScore2 - expectedScore2))

  return { newRating1, newRating2 }
}

export async function GET() {
  try {
    const leagues = await prismaClient.league.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        players: true,
        matches: {
          include: {
            player1: true,
            player2: true
          }
        }
      }
    })

    return NextResponse.json({ leagues })
  } catch (error) {
    console.error('Error fetching leagues:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leagues' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, startDate, endDate, rounds, status } = body

    const league = await prismaClient.league.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        rounds,
        status
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'הליגה נוצרה בהצלחה',
      league 
    })
  } catch (error) {
    console.error('Error creating league:', error)
    return NextResponse.json(
      { error: 'Failed to create league' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { matchId, player1Score, player2Score } = body

    const match = await prismaClient.leagueMatch.update({
      where: { id: matchId },
      data: {
        player1Score,
        player2Score,
        status: 'completed'
      }
    })

    return NextResponse.json({ success: true, match })
  } catch (error) {
    console.error('Error updating match:', error)
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    )
  }
} 