import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { calculatePlayerLevels } from '@/lib/db'

const prisma = new PrismaClient()

export async function POST(request: Request, { params }: { params: { id: string } }) {
  // Params must be awaited in Next.js 15.1.0
  const unwrappedParams = await params;
  const id = unwrappedParams.id;
  
  console.log(`API POST request to refresh stats for player with ID: ${id}`)
  
  if (!id) {
    console.error('Player ID is missing')
    return NextResponse.json(
      { error: 'Player ID is required' },
      { status: 400 }
    )
  }
  
  try {
    // First, reset this player's stats
    await prisma.player.update({
      where: { id },
      data: {
        wins: 0,
        losses: 0,
      }
    });
    
    // Get all completed matches for this player
    const matches = await prisma.match.findMany({
      where: {
        status: 'completed',
        OR: [
          { player1Id: id },
          { player2Id: id }
        ]
      },
      include: {
        player1: true,
        player2: true
      },
      orderBy: {
        date: 'asc' // Process matches in chronological order
      }
    });
    
    console.log(`Found ${matches.length} completed matches for player ${id}`);
    
    // Process each match to recalculate player stats
    for (const match of matches) {
      if (match.bestOfThree) {
        // For "best of three" matches - update each game separately
        const games = [
          { 
            player1Score: match.player1Game1Score, 
            player2Score: match.player2Game1Score,
            completed: match.player1Game1Score !== null && match.player2Game1Score !== null && 
                      (match.player1Game1Score > 0 || match.player2Game1Score > 0)
          },
          { 
            player1Score: match.player1Game2Score, 
            player2Score: match.player2Game2Score,
            completed: match.player1Game2Score !== null && match.player2Game2Score !== null && 
                      (match.player1Game2Score > 0 || match.player2Game2Score > 0)
          },
          { 
            player1Score: match.player1Game3Score, 
            player2Score: match.player2Game3Score,
            completed: match.player1Game3Score !== null && match.player2Game3Score !== null && 
                      (match.player1Game3Score > 0 || match.player2Game3Score > 0)
          }
        ];
        
        // Count individual wins/losses for each game
        let playerWins = 0;
        let playerLosses = 0;
        
        for (const game of games) {
          if (game.completed) {
            if (match.player1Id === id) {
              // Player is player1
              if (game.player1Score! > game.player2Score!) {
                playerWins++;
              } else {
                playerLosses++;
              }
            } else {
              // Player is player2
              if (game.player2Score! > game.player1Score!) {
                playerWins++;
              } else {
                playerLosses++;
              }
            }
          }
        }
        
        // Update player stats
        await prisma.player.update({
          where: { id },
          data: {
            wins: { increment: playerWins },
            losses: { increment: playerLosses }
          }
        });
      } else {
        // For regular matches
        let playerWon = false;
        
        if (match.player1Id === id) {
          // Player is player1
          playerWon = match.player1Score! > match.player2Score!;
        } else {
          // Player is player2
          playerWon = match.player2Score! > match.player1Score!;
        }
        
        // Update player stats
        await prisma.player.update({
          where: { id },
          data: {
            wins: { increment: playerWon ? 1 : 0 },
            losses: { increment: playerWon ? 0 : 1 }
          }
        });
      }
    }
    
    // Recalculate player levels based on updated stats
    await calculatePlayerLevels();
    
    return NextResponse.json({ message: 'Player statistics refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing player stats:', error)
    return NextResponse.json(
      { error: 'Failed to refresh player statistics', details: (error as Error).message },
      { status: 500 }
    )
  }
} 