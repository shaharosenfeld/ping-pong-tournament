import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { validateServerAdminToken, validateAdminAuth } from '@/lib/admin-utils'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            avatar: true,
            level: true,
            wins: true,
            losses: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            level: true,
            wins: true,
            losses: true
          }
        },
        tournament: {
          select: {
            id: true,
            name: true,
            format: true
          }
        }
      }
    })

    // מיון המשחקים: קודם משחקים עתידיים בסדר עולה, אחר כך משחקים שהסתיימו בסדר יורד
    const upcomingMatches = matches
      .filter(match => match.status === 'scheduled' || match.status === 'in_progress')
      .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    
    const completedMatches = matches
      .filter(match => match.status === 'completed')
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    
    const sortedMatches = [...upcomingMatches, ...completedMatches];

    // Calculate win rates for players
    const formattedMatches = sortedMatches.map(match => ({
      ...match,
      player1: {
        ...match.player1,
        winRate: match.player1.wins + match.player1.losses > 0
          ? Math.round((match.player1.wins / (match.player1.wins + match.player1.losses)) * 100)
          : 0
      },
      player2: {
        ...match.player2,
        winRate: match.player2.wins + match.player2.losses > 0
          ? Math.round((match.player2.wins / (match.player2.wins + match.player2.losses)) * 100)
          : 0
      }
    }))

    return NextResponse.json(formattedMatches)
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}

// פונקציית עזר להתמודדות עם מספר רב של נתונים - הסר את זה אם אין לך צורך בו
async function getFilteredMatches(tournamentId: string | undefined, playerId: string | undefined, status: string | undefined) {
  // ... existing code ...
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/matches: Starting request');
    
    // Log all request headers for debugging
    console.log('POST /api/matches: All request headers:');
    request.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // בדיקת הרשאות מנהל באמצעות הפונקציה החדשה
    if (!validateAdminAuth(request)) {
      console.error('POST /api/matches: Admin permission check failed');
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      )
    }
    
    console.log('POST /api/matches: Authentication successful');
    const body = await request.json()
    console.log('POST /api/matches: Received body:', JSON.stringify(body));
    
    const { tournamentId, player1Id, player2Id, date, round, status } = body

    // Validate required fields
    if (!tournamentId || !player1Id || !player2Id || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate that player1 and player2 are different
    if (player1Id === player2Id) {
      return NextResponse.json(
        { error: 'Player 1 and Player 2 must be different' },
        { status: 400 }
      )
    }

    const match = await prisma.match.create({
      data: {
        tournamentId,
        player1Id,
        player2Id,
        date: new Date(date),
        round,
        status: status || 'scheduled'
      },
      include: {
        player1: true,
        player2: true,
        tournament: true
      }
    })

    return NextResponse.json(match)
  } catch (error) {
    console.error('Error creating match:', error)
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  // ... existing code ...
} 