import { prisma } from './prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * סוגי פורמט טורניר אפשריים
 */
export type TournamentFormat = 'knockout' | 'league' | 'groups_knockout';

/**
 * טיפוס הטורניר עם השחקנים
 */
interface Tournament {
  id: string;
  format: string;
  rounds: number;
  groupCount?: number | null;
  advanceCount?: number | null;
  players: Player[];
}

/**
 * טיפוס השחקן
 */
interface Player {
  id: string;
  name: string;
  rating: number;
}

/**
 * יצירת משחקים לטורניר
 * 
 * @param tournament מידע הטורניר
 */
export async function createTournamentMatches(tournament: Tournament): Promise<void> {
  console.log(`Creating matches for tournament ${tournament.id} with format ${tournament.format}`);

  if (!tournament.players || tournament.players.length < 2) {
    console.log('Not enough players to create matches');
    return;
  }

  try {
    // מחיקת משחקים קיימים אם ישנם
    await prisma.match.deleteMany({
      where: { tournamentId: tournament.id }
    });

    // התאמת הפונקציה לפי פורמט הטורניר
    if (tournament.format === 'knockout') {
      await createKnockoutTournament(tournament);
    } else if (tournament.format === 'league') {
      await createLeagueTournament(tournament);
    } else if (tournament.format === 'groups_knockout') {
      await createGroupsKnockoutTournament(tournament);
    } else {
      console.error(`Unsupported tournament format: ${tournament.format}`);
    }

    console.log(`Successfully created matches for tournament ${tournament.id}`);
  } catch (error) {
    console.error('Error creating tournament matches:', error);
    throw error;
  }
}

/**
 * יצירת משחקים לטורניר בפורמט נוק-אאוט
 */
async function createKnockoutTournament(tournament: Tournament): Promise<void> {
  const players = [...tournament.players];
  
  // מיון שחקנים לפי דירוג
  players.sort((a, b) => b.rating - a.rating);
  
  // חישוב מספר הסיבובים הדרושים
  const numRounds = Math.ceil(Math.log2(players.length));
  const totalMatches = Math.pow(2, numRounds) - 1;
  const firstRoundMatches = Math.pow(2, numRounds - 1);
  
  console.log(`Creating knockout tournament with ${players.length} players, ${numRounds} rounds, ${totalMatches} total matches`);
  
  // יצירת מערך של כל המשחקים (כולל ריקים)
  const matchesData = [];
  
  // סידור שחקנים בתבנית נוק-אאוט
  const seededPlayers = seedPlayers(players, firstRoundMatches * 2);
  
  // יצירת משחקי סיבוב ראשון
  for (let i = 0; i < firstRoundMatches; i++) {
    const player1 = seededPlayers[i * 2];
    const player2 = seededPlayers[i * 2 + 1];
    
    // רק אם יש שני שחקנים ממשיים, יצור משחק
    if (player1 && player2) {
      matchesData.push({
        id: uuidv4(),
        tournamentId: tournament.id,
        player1Id: player1.id,
        player2Id: player2.id,
        round: 1,
        status: 'scheduled',
        stage: 'knockout',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000) // יום מהיום
      });
    }
  }
  
  // יצירת המשחקים במסד הנתונים
  if (matchesData.length > 0) {
    await prisma.match.createMany({
      data: matchesData
    });
  }
  
  console.log(`Created ${matchesData.length} first round matches`);
}

/**
 * יצירת משחקים לטורניר בפורמט ליגה
 */
async function createLeagueTournament(tournament: Tournament): Promise<void> {
  const players = tournament.players;
  const rounds = tournament.rounds || 1; // מספר סיבובים
  
  console.log(`Creating league tournament with ${players.length} players, ${rounds} rounds`);
  
  const matchesData = [];
  
  // עבור כל סיבוב
  for (let round = 1; round <= rounds; round++) {
    // יצירת כל המשחקים האפשריים (כל שחקן מול כל שחקן אחר)
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        matchesData.push({
          id: uuidv4(),
          tournamentId: tournament.id,
          player1Id: players[i].id,
          player2Id: players[j].id,
          round,
          status: 'scheduled',
          stage: 'league',
          date: new Date(Date.now() + round * 24 * 60 * 60 * 1000) // יום מהיום + מספר הסיבוב
        });
      }
    }
  }
  
  // יצירת המשחקים במסד הנתונים
  if (matchesData.length > 0) {
    await prisma.match.createMany({
      data: matchesData
    });
  }
  
  console.log(`Created ${matchesData.length} league matches`);
}

/**
 * יצירת משחקים לטורניר בפורמט בתים + נוק-אאוט
 */
async function createGroupsKnockoutTournament(tournament: Tournament): Promise<void> {
  const players = [...tournament.players];
  
  // מיון שחקנים לפי דירוג
  players.sort((a, b) => b.rating - a.rating);
  
  const groupCount = tournament.groupCount || 2;
  const advanceCount = tournament.advanceCount || 2;
  
  console.log(`Creating groups+knockout tournament with ${players.length} players, ${groupCount} groups, ${advanceCount} advancing from each group`);
  
  // חלוקה לקבוצות
  const groups: Player[][] = Array.from({ length: groupCount }, () => []);
  
  // התפלגות שחקנים לקבוצות בצורה שווה יחסית
  players.forEach((player, index) => {
    const groupIndex = index % groupCount;
    groups[groupIndex].push(player);
  });
  
  const matchesData = [];
  
  // יצירת משחקי ליגה בכל קבוצה
  for (let g = 0; g < groups.length; g++) {
    const groupPlayers = groups[g];
    
    // יצירת כל המשחקים האפשריים בתוך הקבוצה
    for (let i = 0; i < groupPlayers.length; i++) {
      for (let j = i + 1; j < groupPlayers.length; j++) {
        matchesData.push({
          id: uuidv4(),
          tournamentId: tournament.id,
          player1Id: groupPlayers[i].id,
          player2Id: groupPlayers[j].id,
          round: 1,
          status: 'scheduled',
          stage: 'group',
          groupName: `Group ${String.fromCharCode(65 + g)}`, // 'Group A', 'Group B', etc.
          date: new Date(Date.now() + 24 * 60 * 60 * 1000) // יום מהיום
        });
      }
    }
  }
  
  // יצירת המשחקים במסד הנתונים
  if (matchesData.length > 0) {
    await prisma.match.createMany({
      data: matchesData
    });
  }
  
  console.log(`Created ${matchesData.length} group stage matches`);
  
  // שלב הנוק-אאוט יתווסף מאוחר יותר לאחר שידועות תוצאות שלב הבתים
}

/**
 * פונקציית עזר למיקום שחקנים בטורניר נוק-אאוט
 */
function seedPlayers(players: Player[], totalSlots: number): (Player | null)[] {
  const result: (Player | null)[] = Array(totalSlots).fill(null);
  
  // אם אין מספיק שחקנים, הוסף מקומות ריקים (bye)
  const actualPlayers = players.length;
  
  // מיקום שחקנים לפי מיקום אופטימלי לטורניר נוק-אאוט
  // המטרה היא לוודא ששחקנים מדורגים גבוה יפגשו בשלבים מאוחרים יותר
  for (let i = 0; i < actualPlayers; i++) {
    const player = players[i];
    
    // חישוב המיקום האופטימלי
    // שיטה זו נקראת "power seeding" ומבטיחה שמספרים גבוהים ונמוכים מפוזרים בצורה שווה
    let position: number;
    
    if (i === 0) position = 0; // ראשון
    else if (i === 1) position = totalSlots - 1; // שני
    else {
      // שאר המיקומים לפי אלגוריתם מיקום נוק-אאוט סטנדרטי
      const pow2 = Math.pow(2, Math.floor(Math.log2(i)));
      const offset = i - pow2;
      position = offset * 2 + 1;
    }
    
    result[position] = player;
  }
  
  return result;
} 