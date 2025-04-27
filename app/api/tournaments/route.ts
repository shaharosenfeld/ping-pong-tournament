import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/db'
import { validateServerAdminToken } from '@/lib/admin-utils'

// Helper function to generate matches for a tournament
async function generateMatches(
  tournamentId: string, 
  playerIds: string[], 
  format: string, 
  rounds: number = 1, 
  groupCount: number = 2, 
  advanceCount: number = 2,
  groupAssignments?: Record<string, string[]>
) {
  const matches = []

  if (format === 'knockout') {
    // For knockout format, create matches in pairs
    for (let i = 0; i < playerIds.length - 1; i += 2) {
      matches.push({
        tournamentId,
        player1Id: playerIds[i],
        player2Id: playerIds[i + 1],
        round: 1,
        status: 'scheduled',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000) // Schedule for tomorrow
      })
    }
  } else if (format === 'league') {
    // For league format, each player plays against every other player
    for (let round = 1; round <= rounds; round++) {
      for (let i = 0; i < playerIds.length; i++) {
        for (let j = i + 1; j < playerIds.length; j++) {
          matches.push({
            tournamentId,
            player1Id: playerIds[i],
            player2Id: playerIds[j],
            round,
            status: 'scheduled',
            date: new Date(Date.now() + round * 24 * 60 * 60 * 1000)
          })
        }
      }
    }
  } else if (format === 'groups_knockout') {
    // For groups + knockout format
    
    if (groupAssignments) {
      // Use provided group assignments
      Object.entries(groupAssignments).forEach(([groupName, groupPlayers]) => {
        // Each player plays against every other player in their group
        for (let i = 0; i < groupPlayers.length; i++) {
          for (let j = i + 1; j < groupPlayers.length; j++) {
            matches.push({
              tournamentId,
              player1Id: groupPlayers[i],
              player2Id: groupPlayers[j],
              round: 1,
              status: 'scheduled',
              stage: 'group',
              groupName,
              date: new Date(Date.now() + 24 * 60 * 60 * 1000)
            })
          }
        }
      });
    } else {
      // Shuffle players for random group assignment
      const shuffledPlayers = [...playerIds].sort(() => Math.random() - 0.5);
      
      // Divide players into groups
      const groups: string[][] = Array.from({ length: groupCount }, () => []);
      shuffledPlayers.forEach((playerId, index) => {
        const groupIndex = index % groupCount;
        groups[groupIndex].push(playerId);
      });
      
      // Create group stage matches (mini league in each group)
      for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
        const groupPlayers = groups[groupIndex];
        const groupName = `Group ${String.fromCharCode(65 + groupIndex)}`; // Group A, B, C, etc.
        
        // Each player plays against every other player in their group
        for (let i = 0; i < groupPlayers.length; i++) {
          for (let j = i + 1; j < groupPlayers.length; j++) {
            matches.push({
              tournamentId,
              player1Id: groupPlayers[i],
              player2Id: groupPlayers[j],
              round: 1,
              status: 'scheduled',
              stage: 'group',
              groupName,
              date: new Date(Date.now() + 24 * 60 * 60 * 1000)
            })
          }
        }
      }
    }
    
    // Note: Knockout stage matches will be created after group stage is complete
  }

  return matches
}

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
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
    
    console.log('GET /api/tournaments: Retrieved tournaments with registration details');
    if (tournaments.length > 0) {
      const firstTournament = tournaments[0];
      console.log('Example tournament fields:', {
        id: firstTournament.id,
        name: firstTournament.name,
        price: firstTournament.price,
        firstPlacePrize: firstTournament.firstPlacePrize,
        secondPlacePrize: firstTournament.secondPlacePrize,
        registrationOpen: firstTournament.registrationOpen
      });
    }
    
    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/tournaments: Starting request');
    
    // Log all request headers for debugging
    console.log('POST /api/tournaments: All request headers:');
    request.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // בדיקת הרשאות מנהל - הרחבת הבדיקה לכלול טוקנים שונים
    const authHeader = request.headers.get('Authorization');
    const adminTokenHeader = request.headers.get('X-Admin-Token');
    const isAdminHeader = request.headers.get('X-Is-Admin');
    
    console.log('POST /api/tournaments: Auth headers:', { 
      Authorization: authHeader,
      'X-Admin-Token': adminTokenHeader,
      'X-Is-Admin': isAdminHeader
    });
    
    // בדיקה יותר מקיפה - מאפשר אימות גם דרך כותרות מותאמות אישית
    // בודק את כל הכותרות האפשריות לאימות
    let isAuthenticated = false;
    
    // בדיקת ה-Authorization header הסטנדרטי
    if (authHeader && validateServerAdminToken(authHeader)) {
      console.log('POST /api/tournaments: Authentication successful via Authorization header');
      isAuthenticated = true;
    } 
    // בדיקת הכותרת המותאמת אישית
    else if (adminTokenHeader && adminTokenHeader.length >= 10) {
      console.log('POST /api/tournaments: Authentication successful via X-Admin-Token header');
      isAuthenticated = true;
    }
    // בדיקה שיש X-Is-Admin וגם טוקן כלשהו
    else if (isAdminHeader === 'true' && (authHeader || adminTokenHeader)) {
      console.log('POST /api/tournaments: Authentication successful via X-Is-Admin flag');
      isAuthenticated = true;
    }
    
    if (!isAuthenticated) {
      console.error('POST /api/tournaments: Admin permission check failed');
      console.error('Auth header value:', authHeader);
      console.error('X-Admin-Token value:', adminTokenHeader);
      console.error('X-Is-Admin value:', isAdminHeader);
      
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      );
    }
    
    console.log('POST /api/tournaments: Authentication successful');
    const body = await request.json();
    console.log('POST /api/tournaments: Received body (partial):', JSON.stringify({
      name: body.name,
      description: body.description?.substring(0, 50) + '...',
      format: body.format,
      players: Array.isArray(body.players) ? `${body.players.length} players` : 'no players'
    }));

    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      format, 
      maxPlayers, 
      rounds, 
      status, 
      players,
      matchGenerationMode,
      manualMatches,
      groupCount,
      advanceCount,
      groupAssignments,
      location
    } = body

    if (!name || !startDate) {
      return NextResponse.json(
        { error: 'שם הטורניר ותאריך התחלה הם שדות חובה' },
        { status: 400 }
      )
    }

    // Create tournament with players if provided
    const tournamentData: any = {
      name,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      format: format || 'knockout',
      maxPlayers: maxPlayers ? parseInt(maxPlayers) : 8,
      rounds: rounds ? parseInt(rounds) : 1,
      status: status || 'draft',
      location,
      registrationOpen: body.registrationOpen || false,
      registrationDeadline: body.registrationDeadline ? new Date(body.registrationDeadline) : null,
      bitPaymentPhone: body.bitPaymentPhone || null,
      bitPaymentName: body.bitPaymentName || null,
      payboxPaymentLink: body.payboxPaymentLink || null,
      price: body.price ? parseFloat(body.price) : null,
      firstPlacePrize: body.firstPlacePrize || null,
      secondPlacePrize: body.secondPlacePrize || null,
      groupCount: format === 'groups_knockout' ? parseInt(groupCount || '2') : null,
      advanceCount: format === 'groups_knockout' ? parseInt(advanceCount || '2') : null,
    }
    
    // Check if players array exists and is not empty before adding player connections
    if (players && players.length > 0) {
      tournamentData.players = {
        connect: players.map((playerId: string) => ({ id: playerId }))
      }
    }
    
    const tournament = await prisma.tournament.create({
      data: tournamentData,
      include: {
        players: true
      }
    })

    // Generate and create matches only if we have players
    let matches = []
    
    if (players && players.length > 0) {
      if (matchGenerationMode === 'manual' && manualMatches && manualMatches.length > 0) {
        // Use manually defined matches
        matches = manualMatches.map((match: { player1Id: string, player2Id: string }) => ({
          tournamentId: tournament.id,
          player1Id: match.player1Id,
          player2Id: match.player2Id,
          round: 1,
          status: 'scheduled',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000) // Schedule for tomorrow
        }))
      } else if (format === 'groups_knockout' && groupAssignments) {
        // For groups_knockout format with manual group assignments
        
        // Create group stage matches based on the group assignments
        Object.entries(groupAssignments as Record<string, string[]>).forEach(([groupName, groupPlayers]) => {
          // Each player plays against every other player in their group
          for (let i = 0; i < groupPlayers.length; i++) {
            for (let j = i + 1; j < groupPlayers.length; j++) {
              matches.push({
                tournamentId: tournament.id,
                player1Id: groupPlayers[i],
                player2Id: groupPlayers[j],
                round: 1,
                status: 'scheduled',
                stage: 'group',
                groupName,
                date: new Date(Date.now() + 24 * 60 * 60 * 1000)
              })
            }
          }
        });
      } else {
        // Generate matches automatically
        matches = await generateMatches(
          tournament.id, 
          players, 
          format || 'knockout', 
          rounds ? parseInt(rounds) : 1,
          groupCount ? parseInt(groupCount) : 2,
          advanceCount ? parseInt(advanceCount) : 2,
          groupAssignments as Record<string, string[]> | undefined
        )
      }
      
      if (matches.length > 0) {
        try {
          await prisma.match.createMany({
            data: matches
          })
        } catch (error) {
          console.error('Error creating matches:', error)
          // Delete the tournament if match creation fails
          await prisma.tournament.delete({
            where: { id: tournament.id }
          })
          return NextResponse.json(
            { error: 'Failed to create matches' },
            { status: 500 }
          )
        }
      }
    }

    // Create notification for new tournament
    await createNotification({
      title: 'טורניר חדש נוצר',
      message: `טורניר חדש "${name}" נוצר ${players && players.length > 0 ? `עם ${players.length} שחקנים` : 'ללא שחקנים'}`,
      type: 'tournament'
    })

    // Fetch the complete tournament data with matches
    const completeData = await prisma.tournament.findUnique({
      where: { id: tournament.id },
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

    return NextResponse.json({ tournament: completeData })
  } catch (error) {
    console.error("Error creating tournament:", error);
    return NextResponse.json(
      { error: "Failed to create tournament", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
