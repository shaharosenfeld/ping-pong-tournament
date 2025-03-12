import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createNotification } from '@/lib/db'
import { validateAdminAuth } from '@/lib/admin-utils'

const prisma = new PrismaClient()

const TBD_PLAYER_NAME = "TBD (יקבע בהמשך)"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  // Params must be awaited in Next.js 15.1.0
  const unwrappedParams = await params;
  const id = unwrappedParams.id;
  
  try {
    console.log(`POST /api/tournaments/${id}/generate-knockout: Starting request`);
    
    // Log all request headers for debugging
    console.log('POST generate-knockout: All request headers:');
    request.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // בדיקת הרשאות מנהל - השתמש בפונקציה החדשה
    if (!validateAdminAuth(request)) {
      console.error('POST generate-knockout: Admin permission check failed');
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      );
    }
    
    console.log('POST generate-knockout: Authentication successful');
    
    // First, check if TBD player exists, if not create it
    let tbdPlayer = await prisma.player.findFirst({
      where: { name: TBD_PLAYER_NAME }
    });
    
    if (!tbdPlayer) {
      tbdPlayer = await prisma.player.create({
        data: {
          name: TBD_PLAYER_NAME,
          level: 3,
          rating: 1000
        }
      });
    }
    
    // Fetch the tournament with all related data
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
    });
    
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }
    
    // Verify this is a groups_knockout tournament
    if (tournament.format !== 'groups_knockout') {
      return NextResponse.json(
        { error: 'This tournament is not in groups + knockout format' },
        { status: 400 }
      );
    }
    
    // Check if knockout stage matches already exist
    const existingKnockoutMatches = tournament.matches.filter(match => match.stage === 'knockout');
    if (existingKnockoutMatches.length > 0) {
      return NextResponse.json(
        { error: 'Knockout stage matches already exist for this tournament' },
        { status: 400 }
      );
    }
    
    // Get group matches
    const groupMatches = tournament.matches.filter(match => match.stage === 'group');
    
    // Get unique group names
    const groupNames = [...new Set(groupMatches.map(match => match.groupName))].filter(Boolean).sort();
    
    if (groupNames.length === 0) {
      return NextResponse.json(
        { error: 'No group matches found' },
        { status: 400 }
      );
    }
    
    // Calculate standings for each group
    const groupStandings: Record<string, any[]> = {};
    
    groupNames.forEach(groupName => {
      if (!groupName) return;
      
      const groupPlayers = new Set<string>();
      
      // Collect all players in this group
      groupMatches
        .filter(match => match.groupName === groupName)
        .forEach(match => {
          groupPlayers.add(match.player1Id);
          groupPlayers.add(match.player2Id);
        });
      
      // Initialize standings for each player
      const standings = Array.from(groupPlayers).map(playerId => {
        return {
          playerId,
          played: 0,
          wins: 0,
          losses: 0,
          points: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          pointsDiff: 0
        };
      });
      
      // Calculate stats for each player
      groupMatches
        .filter(match => match.groupName === groupName && match.status === 'completed')
        .forEach(match => {
          // Player 1 stats
          const player1Standing = standings.find(s => s.playerId === match.player1Id);
          if (player1Standing) {
            player1Standing.played++;
            player1Standing.pointsFor += match.player1Score || 0;
            player1Standing.pointsAgainst += match.player2Score || 0;
            
            if ((match.player1Score || 0) > (match.player2Score || 0)) {
              player1Standing.wins++;
              player1Standing.points += 3; // 3 points for a win
            } else {
              player1Standing.losses++;
            }
          }
          
          // Player 2 stats
          const player2Standing = standings.find(s => s.playerId === match.player2Id);
          if (player2Standing) {
            player2Standing.played++;
            player2Standing.pointsFor += match.player2Score || 0;
            player2Standing.pointsAgainst += match.player1Score || 0;
            
            if ((match.player2Score || 0) > (match.player1Score || 0)) {
              player2Standing.wins++;
              player2Standing.points += 3; // 3 points for a win
            } else {
              player2Standing.losses++;
            }
          }
        });
      
      // Calculate point difference
      standings.forEach(standing => {
        standing.pointsDiff = standing.pointsFor - standing.pointsAgainst;
      });
      
      // Sort standings by points, then by point difference
      const sortedStandings = [...standings].sort((a, b) => {
        // אם יש שוויון בנקודות
        if (a.points === b.points) {
          // בדיקה לפי הפרש נקודות
          if (a.pointsDiff !== b.pointsDiff) {
            return b.pointsDiff - a.pointsDiff; // הפרש נקודות גבוה יותר קודם
          }
          
          // אם גם הפרש הנקודות שווה, בדיקת מפגש ישיר
          const directMatch = groupMatches.find(match => 
            match.status === 'completed' && 
            ((match.player1Id === a.playerId && match.player2Id === b.playerId) || 
             (match.player1Id === b.playerId && match.player2Id === a.playerId))
          );
          
          if (directMatch) {
            // בדיקה מי ניצח במפגש הישיר
            if (directMatch.player1Id === a.playerId) {
              return (directMatch.player1Score || 0) > (directMatch.player2Score || 0) ? -1 : 1;
            } else {
              return (directMatch.player2Score || 0) > (directMatch.player1Score || 0) ? -1 : 1;
            }
          }
          
          // אם אין מפגש ישיר או שהוא לא הסתיים, השוואה לפי נקודות שהושגו
          return b.pointsFor - a.pointsFor;
        }
        
        // מיון לפי נקודות
        return b.points - a.points;
      });
      
      groupStandings[groupName] = sortedStandings;
    });
    
    // Get advancing players from each group
    const advanceCount = tournament.advanceCount || 2;
    const advancingPlayers: string[] = [];
    
    Object.entries(groupStandings).forEach(([groupName, standings]) => {
      // Take top N players from each group
      const groupAdvancing = standings.slice(0, advanceCount).map(s => s.playerId);
      advancingPlayers.push(...groupAdvancing);
    });
    
    // תוספת נקודות דירוג לשחקנים שעברו את שלב הבתים
    for (const playerId of advancingPlayers) {
      await prisma.player.update({
        where: { id: playerId },
        data: { 
          rating: { increment: 15 } // תוספת של 15 נקודות דירוג לשחקנים שעברו את שלב הבתים
        }
      });
    }
    
    // Create notification about players advancing to knockout stage
    await createNotification({
      title: 'שחקנים עלו לשלב הנוק-אאוט',
      message: `${advancingPlayers.length} שחקנים עלו לשלב הנוק-אאוט בטורניר "${tournament.name}"`,
      type: 'tournament'
    });
    
    // If not enough players advanced, return error
    if (advancingPlayers.length < 2) {
      return NextResponse.json(
        { error: 'Not enough players advancing to create knockout stage' },
        { status: 400 }
      );
    }
    
    // Create knockout stage matches
    const knockoutMatches = [];
    
    // Pair players from different groups
    // For example, if we have 2 groups with 2 advancing players each:
    // Group A 1st vs Group B 2nd
    // Group B 1st vs Group A 2nd
    
    const groupCount = groupNames.length;
    const playersPerGroup = advanceCount;
    
    // Create an array of player IDs organized by their group and position
    const organizedPlayers: string[][] = [];
    
    groupNames.forEach(groupName => {
      if (!groupName) return;
      
      const groupAdvancing = groupStandings[groupName].slice(0, advanceCount).map(s => s.playerId);
      organizedPlayers.push(groupAdvancing);
    });
    
    // Create matches based on the number of advancing players
    const totalAdvancing = advancingPlayers.length;
    
    // For a standard knockout bracket, we need a power of 2 number of players
    // Find the nearest power of 2 that can accommodate all advancing players
    let bracketSize = 1;
    while (bracketSize < totalAdvancing) {
      bracketSize *= 2;
    }
    
    // Create the initial round of knockout matches
    // If we have 2 groups with 2 advancing players each (4 total):
    // Match 1: Group A 1st vs Group B 2nd
    // Match 2: Group B 1st vs Group A 2nd
    
    // חישוב מספר הסיבובים בשלב הנוק-אאוט
    const totalRounds = Math.log2(bracketSize);
    
    for (let i = 0; i < Math.min(totalAdvancing, bracketSize) / 2; i++) {
      // For each pair, we want to match 1st from one group with 2nd from another
      const group1Index = i % groupCount;
      const group2Index = (i + 1) % groupCount;
      
      // Get players from their respective positions
      const player1Index = Math.floor(i / groupCount) % playersPerGroup;
      const player2Index = (playersPerGroup - 1) - (Math.floor(i / groupCount) % playersPerGroup);
      
      // Make sure we have valid players
      if (organizedPlayers[group1Index] && organizedPlayers[group1Index][player1Index] &&
          organizedPlayers[group2Index] && organizedPlayers[group2Index][player2Index]) {
        
        // בדיקה אם זה סיבוב ראשון (יש רק סיבוב אחד בסך הכל)
        const isFinalRound = totalRounds === 1;
        // If there's only one round, it's a final match
        // If there are only two rounds total, and we're creating round 1, these are semifinals
        const isSemifinalRound = totalRounds === 2 && !isFinalRound;
        
        knockoutMatches.push({
          tournamentId: id,
          player1Id: organizedPlayers[group1Index][player1Index],
          player2Id: organizedPlayers[group2Index][player2Index],
          round: 1,
          stage: 'knockout',
          status: 'scheduled',
          date: new Date(Date.now() + 48 * 60 * 60 * 1000), // Schedule for 2 days later
          bestOfThree: isFinalRound || isSemifinalRound // אם זה גמר או חצי גמר, אז משחק הטוב מ-3
        });
      }
    }
    
    // אם יש יותר מסיבוב אחד, נצטרך ליצור גם את הסיבובים הבאים
    if (totalRounds > 1) {
      // יצירת משחקי חצי הגמר והגמר (ריקים בשלב זה)
      for (let round = 2; round <= totalRounds; round++) {
        const matchesInRound = Math.pow(2, totalRounds - round);
        
        // הוספת תיעוד לוגים
        console.log(`Creating ${matchesInRound} matches for round ${round}`);
        
        for (let i = 0; i < matchesInRound; i++) {
          // Check if this is a semifinal or final match
          // Finals are in the last round (totalRounds)
          // Semifinals are in the second-to-last round (totalRounds - 1)
          const isFinal = round === totalRounds;
          const isSemifinal = round === totalRounds - 1;
          
          // חישוב של תאריך משוער למשחק (כל סיבוב נדחה ביום ביחס לסיבוב הקודם)
          const daysToAdd = 2 + (round - 1) * 3; // יותר זמן בין הסיבובים הגבוהים
          const estimatedDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
          
          // הוספת יותר מידע וקונטקסט למשחקים
          knockoutMatches.push({
            tournamentId: id,
            player1Id: tbdPlayer.id,
            player2Id: tbdPlayer.id,
            round: round,
            stage: 'knockout',
            status: 'pending',
            date: estimatedDate,
            bestOfThree: isFinal || isSemifinal // Set bestOfThree for both semifinals and finals
          });
        }
      }
    }
    
    // Create the knockout matches in the database
    if (knockoutMatches.length > 0) {
      try {
        await prisma.match.createMany({
          data: knockoutMatches
        });
        
        // Create notification
        await createNotification({
          title: 'שלב הנוק-אאוט נוצר',
          message: `שלב הנוק-אאוט בטורניר "${tournament.name}" נוצר עם ${knockoutMatches.length} משחקים`,
          type: 'tournament'
        });
        
        // Return success
        return NextResponse.json({
          success: true,
          message: `Created ${knockoutMatches.length} knockout stage matches`,
          matches: knockoutMatches
        });
      } catch (dbError) {
        console.error('Error creating knockout matches:', dbError instanceof Error ? dbError.message : String(dbError));
        return NextResponse.json(
          { 
            error: 'Failed to create knockout matches',
            details: dbError instanceof Error ? dbError.message : 'Database error',
            success: false
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Failed to create knockout matches', success: false },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating knockout stage:', error);
    
    // לוג מפורט יותר של השגיאה
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if ('code' in error) {
        console.error('Error code:', (error as any).code);
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate knockout stage', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 