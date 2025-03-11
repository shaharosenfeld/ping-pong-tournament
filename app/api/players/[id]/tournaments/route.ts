import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Params must be awaited in Next.js 15.1.0
  const unwrappedParams = await params;
  const id = unwrappedParams.id;
  
  console.log(`API GET request for player tournament stats with ID: ${id}`)
  
  if (!id) {
    console.error('Player ID is missing')
    return NextResponse.json(
      { error: 'Player ID is required' },
      { status: 400 }
    )
  }
  
  try {
    // Get all tournaments where this player participated
    const tournaments = await prisma.tournament.findMany({
      where: {
        players: {
          some: {
            id
          }
        }
      },
      include: {
        matches: {
          where: {
            status: 'completed',
            OR: [
              { player1Id: id },
              { player2Id: id }
            ]
          }
        }
      }
    });
    
    // Calculate tournaments played
    const tournamentsPlayed = tournaments.length;
    
    // Calculate tournaments won (where player ranked 1st)
    const tournamentsWon = tournaments.filter(tournament => {
      // Check if this is a league tournament
      if (tournament.format === 'league') {
        // Get all matches for this player in the tournament
        const playerMatches = tournament.matches.filter(match => 
          match.player1Id === id || match.player2Id === id
        );
        
        // Calculate win rate in this tournament
        const wins = playerMatches.filter(match => {
          if (match.player1Id === id) {
            return match.player1Score !== null && match.player2Score !== null && match.player1Score > match.player2Score;
          } else {
            return match.player1Score !== null && match.player2Score !== null && match.player2Score > match.player1Score;
          }
        }).length;
        
        // Calculate if player has the highest win rate (simplified approach)
        return wins === playerMatches.length;
      } 
      // For knockout tournaments
      else if (tournament.format === 'knockout' || tournament.format === 'groups_knockout') {
        // Get the final match
        const finalMatch = tournament.matches.find(match => 
          match.round === Math.max(...tournament.matches.map(m => m.round || 0)) && 
          match.status === 'completed'
        );
        
        // Check if player won the final match
        if (finalMatch) {
          if (finalMatch.player1Id === id) {
            return finalMatch.player1Score !== null && finalMatch.player2Score !== null && 
                  finalMatch.player1Score > finalMatch.player2Score;
          } else if (finalMatch.player2Id === id) {
            return finalMatch.player1Score !== null && finalMatch.player2Score !== null && 
                  finalMatch.player2Score > finalMatch.player1Score;
          }
        }
      }
      
      return false;
    }).length;
    
    return NextResponse.json({
      tournamentsPlayed,
      tournamentsWon
    });
  } catch (error) {
    console.error('Error fetching player tournament stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch player tournament stats', details: (error as Error).message },
      { status: 500 }
    )
  }
} 