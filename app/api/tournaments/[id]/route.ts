import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { validateServerAdminToken } from '@/lib/admin-utils'

const prisma = new PrismaClient()

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Params must be awaited in Next.js 15.1.0
  const unwrappedParams = await params;
  const id = unwrappedParams.id;
  
  try {
    console.log('Fetching tournament with ID:', id);
    
    const tournament = await prisma.tournament.findUnique({
      where: { id },
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
    
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(tournament)
  } catch (error) {
    console.error('Error fetching tournament:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // Params must be awaited in Next.js 15.1.0
  const unwrappedParams = await params;
  const id = unwrappedParams.id;
  
  try {
    // בדיקת הרשאות מנהל
    const authHeader = request.headers.get('Authorization');
    
    if (!validateServerAdminToken(authHeader)) {
      console.error('Authentication failed: Invalid or missing admin token');
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      );
    }
    
    const body = await request.json()
    
    // Validate the tournament exists
    const existingTournament = await prisma.tournament.findUnique({
      where: { id },
      include: { 
        matches: true,
        players: true
      }
    })

    if (!existingTournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // For editing, only update fields that make sense to change
    const updateData: any = {
      name: body.name !== undefined ? body.name : existingTournament.name,
      description: body.description !== undefined ? body.description : existingTournament.description,
      endDate: body.endDate ? new Date(body.endDate) : existingTournament.endDate,
    }
    
    // בדיקה מיוחדת לעדכון סטטוס הטורניר
    if (body.status !== undefined) {
      // אם מנסים לעדכן את הסטטוס ל-completed, נבדוק שכל המשחקים הסתיימו
      if (body.status === 'completed' && existingTournament.status !== 'completed') {
        console.log("Attempting to complete tournament:", id)
        
        // בדיקה אם יש משחקי נוק-אאוט
        const knockoutMatches = existingTournament.matches.filter(m => m.stage === 'knockout');
        
        if (knockoutMatches.length > 0) {
          console.log("Tournament has knockout matches:", knockoutMatches.length)
          
          // מציאת הסיבוב המקסימלי
          const roundValues = knockoutMatches.map(m => {
            const roundNum = typeof m.round === 'string' ? parseInt(m.round) : 
                            typeof m.round === 'number' ? m.round : 0;
            return isNaN(roundNum) ? 0 : roundNum;
          }).filter(r => r > 0);
          
          if (roundValues.length > 0) {
            const maxRound = Math.max(...roundValues);
            console.log("Max round in tournament:", maxRound)
            
            // בדיקה אם יש משחקי גמר
            const finalMatches = knockoutMatches.filter(m => {
              const roundNum = typeof m.round === 'string' ? parseInt(m.round) : 
                              typeof m.round === 'number' ? m.round : 0;
              return roundNum === maxRound;
            });
            
            console.log("Final matches:", finalMatches.length)
            
            // בדיקה אם כל משחקי הגמר הסתיימו
            const allFinalMatchesCompleted = finalMatches.every(m => m.status === 'completed');
            
            if (!allFinalMatchesCompleted) {
              console.log("Not all final matches are completed, cannot complete tournament")
              return NextResponse.json(
                { error: 'Cannot complete tournament: not all final matches are completed' },
                { status: 400 }
              )
            }
          }
        }
      }
      
      // אם הכל תקין, עדכון הסטטוס
      updateData.status = body.status;
    }

    // Only add these fields if they are explicitly provided, otherwise keep existing values
    if (body.location !== undefined) {
      updateData.location = body.location;
    }

    // Start a transaction to handle all updates
    const tournament = await prisma.$transaction(async (tx) => {
      // Update tournament basic info
      const updatedTournament = await tx.tournament.update({
        where: { id },
        data: updateData,
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

      // If players array is provided, update tournament players
      if (body.players) {
        // Find players that were removed (in existing but not in new players list)
        const existingPlayerIds = existingTournament.players.map(p => p.id);
        const newPlayerIds = body.players;
        const removedPlayerIds = existingPlayerIds.filter((id: string) => !newPlayerIds.includes(id));
        const addedPlayerIds = newPlayerIds.filter((id: string) => !existingPlayerIds.includes(id));

        // If players were removed, delete their matches
        if (removedPlayerIds.length > 0) {
          console.log(`Removing matches for players: ${removedPlayerIds.join(', ')}`);
          
          // Delete all matches that involve removed players
          await tx.match.deleteMany({
            where: {
              tournamentId: id,
              OR: [
                { player1Id: { in: removedPlayerIds } },
                { player2Id: { in: removedPlayerIds } }
              ]
            }
          });
        }

        // First remove all current players
        await tx.tournament.update({
          where: { id },
          data: {
            players: {
              set: []
            }
          }
        })
        
        // Then connect the new players
        await tx.tournament.update({
          where: { id },
          data: {
            players: {
              connect: body.players.map((playerId: string) => ({ id: playerId }))
            }
          }
        })

        // If players were added, create new matches for them
        if (addedPlayerIds.length > 0) {
          console.log(`Adding matches for new players: ${addedPlayerIds.join(', ')}`);
          
          // Get tournament format from existing data
          const format = existingTournament.format;
          const rounds = existingTournament.rounds;
          
          const newMatches = [];
          
          if (format === 'knockout') {
            // For knockout format, if players were added, we need to pair them with existing players
            // Simple approach: pair new players with each other or with existing players
            // This is simplified and might need to be adjusted based on your tournament structure
            for (const addedPlayerId of addedPlayerIds) {
              // Find players this added player should play against (all other players)
              const opponentIds = newPlayerIds.filter((opponentId: string) => opponentId !== addedPlayerId);
              
              // Create a match for each pair (limiting to avoid duplicate matches)
              for (const opponentId of opponentIds) {
                // Check if this match already exists
                const matchExists = await tx.match.findFirst({
                  where: {
                    tournamentId: id,
                    OR: [
                      {
                        player1Id: addedPlayerId,
                        player2Id: opponentId
                      },
                      {
                        player1Id: opponentId,
                        player2Id: addedPlayerId
                      }
                    ]
                  }
                });
                
                if (!matchExists) {
                  newMatches.push({
                    tournamentId: id,
                    player1Id: addedPlayerId,
                    player2Id: opponentId,
                    round: 1, // Start with round 1 for now
                    status: 'scheduled',
                    date: new Date(Date.now() + 24 * 60 * 60 * 1000)
                  });
                }
              }
            }
          } else if (format === 'league') {
            // For league format, create matches between new players and all other players
            for (const addedPlayerId of addedPlayerIds) {
              // All other players in the tournament (including other newly added players)
              const opponentIds = newPlayerIds.filter((opponentId: string) => opponentId !== addedPlayerId);
              
              for (const opponentId of opponentIds) {
                // For each round
                for (let round = 1; round <= rounds; round++) {
                  // Check if this match already exists
                  const matchExists = await tx.match.findFirst({
                    where: {
                      tournamentId: id,
                      round,
                      OR: [
                        {
                          player1Id: addedPlayerId,
                          player2Id: opponentId
                        },
                        {
                          player1Id: opponentId,
                          player2Id: addedPlayerId
                        }
                      ]
                    }
                  });
                  
                  if (!matchExists) {
                    newMatches.push({
                      tournamentId: id,
                      player1Id: addedPlayerId,
                      player2Id: opponentId,
                      round,
                      status: 'scheduled',
                      date: new Date(Date.now() + round * 24 * 60 * 60 * 1000)
                    });
                  }
                }
              }
            }
          }
          
          // Create the new matches
          if (newMatches.length > 0) {
            await tx.match.createMany({
              data: newMatches
            });
            console.log(`Created ${newMatches.length} new matches`);
          }
        }
      }

      // Fetch and return the updated tournament with all relations
      return tx.tournament.findUnique({
        where: { id },
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
    })

    return NextResponse.json(tournament)
  } catch (error) {
    console.error('Error updating tournament:', error)
    return NextResponse.json(
      { error: 'Failed to update tournament' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // Params must be awaited in Next.js 15.1.0
  const unwrappedParams = await params;
  const id = unwrappedParams.id;

  try {
    // בדיקת הרשאות מנהל עם הפונקציה החדשה
    const authHeader = request.headers.get('Authorization');
    
    if (!validateServerAdminToken(authHeader)) {
      console.error('Authentication failed: Invalid or missing admin token');
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      );
    }
    
    // First delete all matches associated with this tournament
    await prisma.match.deleteMany({
      where: { tournamentId: id }
    })

    // Then delete the tournament
    await prisma.tournament.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Tournament deleted successfully' })
  } catch (error) {
    console.error('Error deleting tournament:', error)
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: 500 }
    )
  }
} 