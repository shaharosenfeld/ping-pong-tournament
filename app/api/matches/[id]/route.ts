import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { calculatePlayerLevels, updatePlayerLevel, createNotification } from '@/lib/db'

const prisma = new PrismaClient()

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Params must be awaited in Next.js 15.1.0
  const unwrappedParams = await params;
  const id = unwrappedParams.id;
  
  try {
    console.log('Fetching match with ID:', id);
    
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        player1: true,
        player2: true,
        tournament: true
      }
    })
    
    if (!match) {
      console.log('Match not found for ID:', id);
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(match)
  } catch (error) {
    console.error('Error fetching match:', error)
    return NextResponse.json(
      { error: 'Failed to fetch match', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  // Params must be awaited in Next.js 15.1.0
  const unwrappedParams = await params;
  const id = unwrappedParams.id;
  
  try {
    // בדיקת הרשאות מנהל
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Authentication failed: Missing or invalid Authorization header');
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Validate that token exists and starts with admin-
    if (!token || !token.startsWith('admin-')) {
      console.error('Authentication failed: Invalid token format');
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      );
    }
    
    const body = await request.json()
    const { 
      player1Score, 
      player2Score, 
      status,
      player1Game1Score,
      player2Game1Score,
      player1Game2Score,
      player2Game2Score,
      player1Game3Score,
      player2Game3Score,
      player1Wins,
      player2Wins,
      currentGame
    } = body

    const match = await prisma.match.update({
      where: { id },
      data: {
        player1Score: player1Score !== undefined ? parseInt(player1Score) : undefined,
        player2Score: player2Score !== undefined ? parseInt(player2Score) : undefined,
        player1Game1Score: player1Game1Score !== undefined ? parseInt(player1Game1Score) : undefined,
        player2Game1Score: player2Game1Score !== undefined ? parseInt(player2Game1Score) : undefined,
        player1Game2Score: player1Game2Score !== undefined ? parseInt(player1Game2Score) : undefined,
        player2Game2Score: player2Game2Score !== undefined ? parseInt(player2Game2Score) : undefined,
        player1Game3Score: player1Game3Score !== undefined ? parseInt(player1Game3Score) : undefined,
        player2Game3Score: player2Game3Score !== undefined ? parseInt(player2Game3Score) : undefined,
        player1Wins: player1Wins !== undefined ? parseInt(player1Wins) : undefined,
        player2Wins: player2Wins !== undefined ? parseInt(player2Wins) : undefined,
        currentGame: currentGame !== undefined ? parseInt(currentGame) : undefined,
        status: status || undefined
      },
      include: {
        tournament: true,
        player1: true,
        player2: true
      }
    })

    // If match is completed, update player stats
    if (status === 'completed' && player1Score !== null && player2Score !== null) {
      // נקבע מי ניצח את המשחק הכולל - במשחקי bestOfThree זה מספר הניצחונות, במשחקים רגילים זה הניקוד
      let player1Won: boolean;
      
      if (match.bestOfThree) {
        player1Won = player1Wins !== undefined && player2Wins !== undefined && player1Wins > player2Wins;
      } else {
        player1Won = player1Score > player2Score;
      }

      if (match.bestOfThree) {
        // עדכון נפרד לכל משחק בשיטת "הטוב משלוש"
        const games = [
          { 
            player1Score: match.player1Game1Score, 
            player2Score: match.player2Game1Score,
            completed: match.player1Game1Score !== null && match.player2Game1Score !== null && 
                      match.player1Game1Score !== undefined && match.player2Game1Score !== undefined &&
                      (match.player1Game1Score > 0 || match.player2Game1Score > 0)
          },
          { 
            player1Score: match.player1Game2Score, 
            player2Score: match.player2Game2Score,
            completed: match.player1Game2Score !== null && match.player2Game2Score !== null && 
                      match.player1Game2Score !== undefined && match.player2Game2Score !== undefined &&
                      (match.player1Game2Score > 0 || match.player2Game2Score > 0)
          },
          { 
            player1Score: match.player1Game3Score, 
            player2Score: match.player2Game3Score,
            completed: match.player1Game3Score !== null && match.player2Game3Score !== null && 
                      match.player1Game3Score !== undefined && match.player2Game3Score !== undefined &&
                      (match.player1Game3Score > 0 || match.player2Game3Score > 0)
          }
        ];

        // עבור משחקי "הטוב משלוש", אנחנו קובעים ניצחון/הפסד אחד בלבד לפי התוצאה הסופית
        let player1RatingChange = 0;
        let player2RatingChange = 0;

        // עדכון דירוג לפי כל משחק בנפרד (רק דירוג, לא ניצחונות/הפסדים)
        for (const game of games) {
          if (game.completed) {
            const player1WonGame = game.player1Score! > game.player2Score!;
            
            // חישוב שינוי דירוג עם מקדם K מותאם
            const K = 16; // מקדם מותאם למשחקים בשיטת הטוב משלוש
            const expectedScore1 = 1 / (1 + Math.pow(10, (match.player2.rating - match.player1.rating) / 400));
            const actualScore1 = player1WonGame ? 1 : 0;
            const ratingChange = Math.round(K * (actualScore1 - expectedScore1));
            
            player1RatingChange += ratingChange;
            player2RatingChange -= ratingChange;
          }
        }

        // עדכון ניצחון/הפסד לפי התוצאה הסופית
        const player1Won = player1Wins! > player2Wins!;

        // עדכון סטטיסטיקות כלליות
        await Promise.all([
          prisma.player.update({
            where: { id: match.player1Id },
            data: {
              wins: { increment: player1Won ? 1 : 0 },
              losses: { increment: player1Won ? 0 : 1 },
              rating: { increment: player1RatingChange }
            }
          }),
          prisma.player.update({
            where: { id: match.player2Id },
            data: {
              wins: { increment: player1Won ? 0 : 1 },
              losses: { increment: player1Won ? 1 : 0 },
              rating: { increment: player2RatingChange }
            }
          })
        ]);
      
        // עדכון סטטיסטיקות לפי משחקים בודדים
        await Promise.all([
          prisma.player.update({
            where: { id: match.player1Id },
            data: {
              wins: { increment: player1Won ? 1 : 0 },
              losses: { increment: player1Won ? 0 : 1 },
              rating: { increment: player1RatingChange }
            }
          }),
          prisma.player.update({
            where: { id: match.player2Id },
            data: {
              wins: { increment: player1Won ? 0 : 1 },
              losses: { increment: player1Won ? 1 : 0 },
              rating: { increment: player2RatingChange }
            }
          })
        ]);
      
        // בונוס דירוג עבור ניצחון במפגש הכולל, לפי רמת היריב
        if (player1Won) {
          const bonusPoints = calculateBonusPoints(match.player2.level);
          await prisma.player.update({
            where: { id: match.player1Id },
            data: { rating: { increment: bonusPoints } }
          });
        } else {
          const bonusPoints = calculateBonusPoints(match.player1.level);
          await prisma.player.update({
            where: { id: match.player2Id },
            data: { rating: { increment: bonusPoints } }
          });
        }
      } else {
        // משחק רגיל (לא הטוב משלוש)
        // חישוב שינוי דירוג עם התחשבות ברמת היריב
        const K = 32; // מקדם תיקון רגיל
        const expectedScore1 = 1 / (1 + Math.pow(10, (match.player2.rating - match.player1.rating) / 400));
        const actualScore1 = player1Won ? 1 : 0;
        const ratingChange = Math.round(K * (actualScore1 - expectedScore1));
        
        // בונוס נוסף לפי רמת היריב
        const bonusPoints = player1Won ? 
          calculateBonusPoints(match.player2.level) : 
          calculateBonusPoints(match.player1.level);
        
        // עדכון ניצחונות/הפסדים ודירוג
        await Promise.all([
          prisma.player.update({
            where: { id: match.player1Id },
            data: {
              wins: player1Won ? { increment: 1 } : undefined,
              losses: !player1Won ? { increment: 1 } : undefined,
              rating: { increment: player1Won ? ratingChange + bonusPoints : ratingChange }
            }
          }),
          prisma.player.update({
            where: { id: match.player2Id },
            data: {
              wins: !player1Won ? { increment: 1 } : undefined,
              losses: player1Won ? { increment: 1 } : undefined,
              rating: { increment: !player1Won ? -ratingChange + bonusPoints : -ratingChange }
            }
          })
        ]);
      }
      
      // Update player levels based on new ratings
      await Promise.all([
        updatePlayerLevel(match.player1Id),
        updatePlayerLevel(match.player2Id)
      ]);

      // בדיקה אם זה משחק גמר בטורניר נוק-אאוט או בתים+נוק-אאוט
      if ((match.tournament.format === 'knockout' || match.tournament.format === 'groups_knockout') && 
          match.stage === 'knockout' && status === 'completed') {
        
        console.log("Processing completed knockout match:", match.id, "in tournament:", match.tournamentId)
        console.log("Tournament format:", match.tournament.format, "Match stage:", match.stage)
        
        // בדיקה אם זה משחק הגמר
        const tournamentMatches = await prisma.match.findMany({
          where: { 
            tournamentId: match.tournamentId,
            stage: 'knockout'
          },
          orderBy: {
            round: 'asc'
          }
        });
        
        console.log("Found knockout matches in tournament:", tournamentMatches.length)
        
        // וידוא שיש לפחות משחק אחד
        if (tournamentMatches.length === 0) {
          console.log("No knockout matches found in tournament")
          return NextResponse.json(match)
        }
        
        // מציאת הסיבוב המקסימלי המתוכנן (לא בהכרח הסיבוב הנוכחי)
        const roundValues = tournamentMatches.map(m => {
          const roundNum = typeof m.round === 'string' ? parseInt(m.round) : m.round;
          return isNaN(roundNum) ? 0 : roundNum;
        }).filter(r => r > 0);
        
        console.log("Round values:", roundValues)
        
        if (roundValues.length === 0) {
          console.log("No valid round values found")
          return NextResponse.json(match)
        }
        
        const maxRound = Math.max(...roundValues);
        const currentRound = typeof match.round === 'string' ? parseInt(match.round) : match.round;
        
        console.log("Max round in tournament:", maxRound, "Current match round:", currentRound)
        
        // בדיקה אם זה באמת משחק הגמר (הסיבוב האחרון) ולא חצי גמר
        if (currentRound === maxRound) {
          console.log("This is a final match")
          // בדיקה נוספת - האם כל המשחקים בסיבוב הזה הסתיימו
          const finalRoundMatches = tournamentMatches.filter(m => {
            const roundNum = typeof m.round === 'string' ? parseInt(m.round) : m.round;
            return roundNum === maxRound;
          });
          
          const allFinalMatchesCompleted = finalRoundMatches.every(m => m.status === 'completed');
          
          console.log("Final round matches:", finalRoundMatches.length, "All completed:", allFinalMatchesCompleted)
          
          if (allFinalMatchesCompleted) {
            console.log("All final matches completed, updating tournament status to completed")
            
            // עדכון סטטוס הטורניר לסיום
            await prisma.tournament.update({
              where: { id: match.tournamentId },
              data: { status: 'completed' }
            });
            
            console.log("Tournament status updated to completed successfully")
            
            // Update player rankings based on tournament results
            try {
              const { updatePlayerRankings } = await import('@/lib/db');
              await updatePlayerRankings(match.tournamentId);
              console.log("Player rankings updated successfully")
              
              // Create notification about tournament completion
              await createNotification({
                title: 'טורניר הסתיים',
                message: `הטורניר "${match.tournament.name}" הסתיים ודירוג השחקנים עודכן`,
                type: 'tournament'
              });
            } catch (error) {
              console.error("Error updating player rankings:", error);
            }
          }
        } 
        else if (currentRound < maxRound) {
          // זה משחק שאינו הגמר (כנראה חצי גמר או רבע גמר וכו')
          console.log(`This is round ${currentRound} match (max round is ${maxRound})`)
          
          // עלינו להעביר את המנצח למשחק הבא
          // נמצא את כל המשחקים בסיבוב הנוכחי
          const currentRoundMatches = tournamentMatches.filter(m => {
            const roundNum = typeof m.round === 'string' ? parseInt(m.round) : m.round;
            return roundNum === currentRound;
          });
          
          console.log(`Found ${currentRoundMatches.length} matches in round ${currentRound}`)
          
          // בדיקה האם כל המשחקים בסיבוב הנוכחי הסתיימו
          const allCurrentRoundCompleted = currentRoundMatches.every(m => m.status === 'completed');
          
          console.log(`All matches in round ${currentRound} completed: ${allCurrentRoundCompleted}`)
          
          if (allCurrentRoundCompleted) {
            // ניצור או נעדכן את המשחקים בסיבוב הבא
            const nextRoundMatches = tournamentMatches.filter(m => {
              const roundNum = typeof m.round === 'string' ? parseInt(m.round) : m.round;
              return roundNum === currentRound + 1;
            });
            
            console.log(`Found ${nextRoundMatches.length} matches in round ${currentRound + 1}`)
            
            // מספר המשחקים בסיבוב הבא אמור להיות חצי ממספר המשחקים בסיבוב הנוכחי
            const expectedNextRoundMatches = Math.ceil(currentRoundMatches.length / 2);
            
            console.log(`Expected ${expectedNextRoundMatches} matches in round ${currentRound + 1}`)
            
            // אם אין מספיק משחקים בסיבוב הבא, ניצור אותם
            if (nextRoundMatches.length < expectedNextRoundMatches) {
              console.log(`Creating ${expectedNextRoundMatches - nextRoundMatches.length} new matches for round ${currentRound + 1}`)
              
              // מיון המשחקים בסיבוב הנוכחי
              const currentRoundMatchesSorted = [...currentRoundMatches].sort((a, b) => {
                // מיון לפי מספר המשחק בסיבוב (אם יש)
                const matchNumberA = a.id;
                const matchNumberB = b.id;
                return matchNumberA.localeCompare(matchNumberB);
              });
              
              // ארגון הזוגות של המשחקים הבאים
              const matchPairs = [];
              for (let i = 0; i < currentRoundMatchesSorted.length; i += 2) {
                if (i + 1 < currentRoundMatchesSorted.length) {
                  matchPairs.push([currentRoundMatchesSorted[i], currentRoundMatchesSorted[i + 1]]);
                } else {
                  // במקרה שיש מספר אי-זוגי של משחקים, השחקן האחרון מתקדם אוטומטית
                  matchPairs.push([currentRoundMatchesSorted[i]]);
                }
              }
              
              console.log(`Created ${matchPairs.length} match pairs for round ${currentRound + 1}`)
              
              // יצירת המשחקים החדשים
              for (let i = 0; i < matchPairs.length; i++) {
                const pair = matchPairs[i];
                
                // מציאת המנצחים
                const winners = pair.map(m => {
                  if (m.player1Score === null || m.player2Score === null) return undefined;
                  return m.player1Score > m.player2Score ? m.player1Id : m.player2Id;
                }).filter((id): id is string => id !== undefined);
                
                // בדיקה אם יש כבר משחק בסיבוב הבא עבור זוג זה
                const existingMatch = nextRoundMatches[i];
                
                if (existingMatch) {
                  // עדכון המשחק הקיים
                  console.log(`Updating existing match ${existingMatch.id} with winners: ${winners.join(', ')}`)
                  
                  // מציאת שחקן TBD אם יש רק מנצח אחד כרגע
                  let player1Id = winners[0] || existingMatch.player1Id;
                  let player2Id = winners[1] || existingMatch.player2Id;
                  
                  // אם יש רק שחקן אחד אמיתי, נחפש שחקן TBD
                  if (winners.length === 1) {
                    const tbdPlayer = await prisma.player.findFirst({
                      where: { 
                        name: { 
                          contains: 'TBD' 
                        } 
                      }
                    });
                    
                    if (tbdPlayer) {
                      if (!winners[0]) player1Id = tbdPlayer.id;
                      if (!winners[1]) player2Id = tbdPlayer.id;
                    }
                  }
                  
                  await prisma.match.update({
                    where: { id: existingMatch.id },
                    data: {
                      player1Id,
                      player2Id,
                      status: 'scheduled'
                    }
                  });
                } else {
                  // יצירת משחק חדש
                  console.log(`Creating new match for round ${currentRound + 1} with winners: ${winners.join(', ')}`)
                  
                  // אם אין שני מנצחים, משתמשים בשחקן TBD
                  if (winners.length < 2) {
                    const tbdPlayer = await prisma.player.findFirst({
                      where: { 
                        name: { 
                          contains: 'TBD' 
                        } 
                      }
                    });
                    
                    if (tbdPlayer) {
                      // יצירת משחק חדש עם השחקן שזמין כרגע
                      const finalMatch = await prisma.match.create({
                        data: {
                          tournamentId: match.tournamentId,
                          player1Id: winners[0] || tbdPlayer.id,
                          player2Id: winners.length > 1 ? winners[1] : tbdPlayer.id,
                          round: currentRound + 1,
                          stage: 'knockout',
                          status: 'scheduled',
                          bestOfThree: currentRound >= maxRound - 2, // חצי גמר וגמר הם הטוב מ-3
                          date: new Date(Date.now() + 24 * 60 * 60 * 1000) // משחק הסיבוב הבא מתוכנן ליום למחרת
                        }
                      });
                      console.log(`Created new match for round ${currentRound + 1}: ${finalMatch.id}`)
                    } else {
                      console.error("Could not find TBD player for placeholder")
                    }
                  } else {
                    // יצירת משחק חדש עם שני המנצחים
                    const nextMatch = await prisma.match.create({
                      data: {
                        tournamentId: match.tournamentId,
                        player1Id: winners[0],
                        player2Id: winners[1],
                        round: currentRound + 1,
                        stage: 'knockout',
                        status: 'scheduled',
                        bestOfThree: currentRound >= maxRound - 2, // חצי גמר וגמר הם הטוב מ-3
                        date: new Date(Date.now() + 24 * 60 * 60 * 1000) // משחק הסיבוב הבא מתוכנן ליום למחרת
                      }
                    });
                    console.log(`Created new match for round ${currentRound + 1}: ${nextMatch.id}`)
                  }
                }
              }
              
              // יצירת התראה על יצירת סיבוב חדש
              try {
                await createNotification({
                  title: `סיבוב ${currentRound + 1} נוצר`,
                  message: `משחקי סיבוב ${currentRound + 1} בטורניר "${match.tournament.name}" נוצרו אוטומטית`,
                  type: 'tournament'
                });
                console.log(`Round ${currentRound + 1} notification created successfully`)
              } catch (notificationError) {
                console.error("Error creating notification:", notificationError)
              }
            } else {
              // אם יש כבר מספיק משחקים בסיבוב הבא, נעדכן את השחקנים
              // מיון המשחקים בסיבוב הנוכחי
              const currentRoundMatchesSorted = [...currentRoundMatches].sort((a, b) => {
                // מיון לפי מספר המשחק בסיבוב (אם יש)
                const matchNumberA = a.id;
                const matchNumberB = b.id;
                return matchNumberA.localeCompare(matchNumberB);
              });
              
              // ארגון הזוגות של המשחקים הבאים
              const matchPairs = [];
              for (let i = 0; i < currentRoundMatchesSorted.length; i += 2) {
                if (i + 1 < currentRoundMatchesSorted.length) {
                  matchPairs.push([currentRoundMatchesSorted[i], currentRoundMatchesSorted[i + 1]]);
                } else {
                  // במקרה שיש מספר אי-זוגי של משחקים, השחקן האחרון מתקדם אוטומטית
                  matchPairs.push([currentRoundMatchesSorted[i]]);
                }
              }
              
              // עדכון המשחקים הקיימים
              for (let i = 0; i < Math.min(matchPairs.length, nextRoundMatches.length); i++) {
                const pair = matchPairs[i];
                const existingMatch = nextRoundMatches[i];
                
                // מציאת המנצחים
                const winners = pair.map(m => {
                  if (m.player1Score === null || m.player2Score === null) return undefined;
                  return m.player1Score > m.player2Score ? m.player1Id : m.player2Id;
                }).filter((id): id is string => id !== undefined);
                
                if (winners.length > 0) {
                  // עדכון המשחק הקיים עם המנצחים
                  console.log(`Updating match ${existingMatch.id} with winners: ${winners.join(', ')}`)
                  
                  // מציאת שחקן TBD אם יש רק מנצח אחד כרגע
                  let player1Id = winners[0] || existingMatch.player1Id;
                  let player2Id = winners[1] || existingMatch.player2Id;
                  
                  // אם יש רק שחקן אחד אמיתי, נחפש שחקן TBD
                  if (winners.length === 1) {
                    const tbdPlayer = await prisma.player.findFirst({
                      where: { 
                        name: { 
                          contains: 'TBD' 
                        } 
                      }
                    });
                    
                    if (tbdPlayer) {
                      if (!winners[0]) player1Id = tbdPlayer.id;
                      if (!winners[1]) player2Id = tbdPlayer.id;
                    }
                  }
                  
                  await prisma.match.update({
                    where: { id: existingMatch.id },
                    data: {
                      player1Id,
                      player2Id,
                      status: 'scheduled'
                    }
                  });
                }
              }
            }
          }
        }
      }

      // Create notification for completed match
      const winner = player1Won ? match.player1.name : match.player2.name
      const loser = player1Won ? match.player2.name : match.player1.name
      const score = player1Won 
        ? `${player1Score}-${player2Score}` 
        : `${player2Score}-${player1Score}`
      
      await createNotification({
        title: 'משחק הסתיים',
        message: `${winner} ניצח את ${loser} בתוצאה ${score} בטורניר ${match.tournament.name}`,
        type: 'match'
      })

      // After updating player stats, trigger level recalculation
      // This ensures player levels are always updated based on the latest ratings
      try {
        await calculatePlayerLevels();
      } catch (err) {
        console.error('Failed to recalculate player levels:', err);
        // Continue processing - don't fail the entire request if just level calculation fails
      }
    }

    return NextResponse.json(match)
  } catch (error) {
    console.error('Error updating match:', error)
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // Params must be awaited in Next.js 15.1.0
  const unwrappedParams = await params;
  const id = unwrappedParams.id;
  
  try {
    // בדיקת הרשאות מנהל
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Authentication failed: Missing or invalid Authorization header');
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Validate that token exists and starts with admin-
    if (!token || !token.startsWith('admin-')) {
      console.error('Authentication failed: Invalid token format');
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      );
    }
    
    const match = await prisma.match.findUnique({
      where: { id: id },
      include: {
        player1: true,
        player2: true,
        tournament: true
      }
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // If match was completed, decrement player stats
    if (match.status === 'completed' && match.player1Score !== null && match.player2Score !== null) {
      // נקבע מי ניצח את המשחק הכולל - במשחקי bestOfThree זה מספר הניצחונות, במשחקים רגילים זה הניקוד
      let player1Won: boolean;
      
      if (match.bestOfThree) {
        player1Won = match.player1Wins !== undefined && match.player2Wins !== undefined && match.player1Wins > match.player2Wins;
      } else {
        player1Won = match.player1Score > match.player2Score;
      }

      await Promise.all([
        prisma.player.update({
          where: { id: match.player1Id },
          data: {
            wins: player1Won ? { decrement: 1 } : undefined,
            losses: !player1Won ? { decrement: 1 } : undefined
          }
        }),
        prisma.player.update({
          where: { id: match.player2Id },
          data: {
            wins: !player1Won ? { decrement: 1 } : undefined,
            losses: player1Won ? { decrement: 1 } : undefined
          }
        })
      ])
      
      // If it was a league match, reverse the rating changes
      if (match.tournament.format === 'league') {
        // Calculate what the rating change was and reverse it
        const { newRating1, newRating2 } = calculateNewRatings(
          match.player1.rating,
          match.player2.rating,
          player1Won
        )
        
        const ratingChange = newRating1 - match.player1.rating
        
        // Reverse the rating change
        await Promise.all([
          prisma.player.update({
            where: { id: match.player1Id },
            data: { rating: match.player1.rating - ratingChange }
          }),
          prisma.player.update({
            where: { id: match.player2Id },
            data: { rating: match.player2.rating + ratingChange }
          })
        ])
        
        // Update player levels based on new ratings
        await calculatePlayerLevels()
      }
      
      // Create notification for deleted match
      await createNotification({
        title: 'משחק נמחק',
        message: `משחק בין ${match.player1.name} ל-${match.player2.name} בטורניר ${match.tournament.name} נמחק`,
        type: 'match'
      })
    }

    // Delete the match
    await prisma.match.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Match deleted successfully' })
  } catch (error) {
    console.error('Error deleting match:', error)
    return NextResponse.json(
      { error: 'Failed to delete match' },
      { status: 500 }
    )
  }
}

// Helper function to calculate new ratings
function calculateNewRatings(rating1: number, rating2: number, player1Won: boolean) {
  const K = 32 // Rating adjustment factor
  const expectedScore1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400))
  const actualScore1 = player1Won ? 1 : 0

  const ratingChange = Math.round(K * (actualScore1 - expectedScore1))
  
  return {
    newRating1: rating1 + ratingChange,
    newRating2: rating2 - ratingChange
  }
}

// פונקציה לחישוב נקודות בונוס לפי רמת היריב
function calculateBonusPoints(opponentLevel: number): number {
  switch (opponentLevel) {
    case 5: return 10; // בונוס גדול על ניצחון נגד שחקן ברמה 5
    case 4: return 7;  // בונוס על ניצחון נגד שחקן ברמה 4
    case 3: return 5;  // בונוס על ניצחון נגד שחקן ברמה 3
    case 2: return 3;  // בונוס קטן על ניצחון נגד שחקן ברמה 2
    case 1: return 1;  // בונוס מינימלי על ניצחון נגד שחקן ברמה 1
    default: return 0;
  }
} 