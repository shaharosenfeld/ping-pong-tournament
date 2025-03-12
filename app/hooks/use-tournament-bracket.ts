import { useState, useEffect } from 'react';

interface BracketMatch {
  id: string;
  round: number;
  position: number;
  playerA?: { id: string; name: string; };
  playerB?: { id: string; name: string; };
  winner?: 'A' | 'B';
  scoreA?: number;
  scoreB?: number;
  status: 'scheduled' | 'in_progress' | 'completed';
}

interface BracketData {
  rounds: {
    round: number;
    name: string;
    matches: BracketMatch[];
  }[];
}

export function useTournamentBracket(tournamentId: string, isKnockoutFormat: boolean = false) {
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBracketData = async () => {
      if (!tournamentId) {
        setIsLoading(false);
        return;
      }

      // רק אם הפורמט הוא נוק-אאוט, אנחנו טוענים את המידע
      if (!isKnockoutFormat) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/tournaments/${tournamentId}/bracket`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch bracket data');
        }
        
        const data = await response.json();
        
        // המרת המידע מהשרת למבנה הנדרש
        const formattedData = formatBracketData(data);
        setBracketData(formattedData);
      } catch (err) {
        console.error('Error fetching bracket data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBracketData();
  }, [tournamentId, isKnockoutFormat]);

  // פונקציה להמרת המידע מהשרת למבנה הנדרש לתצוגת המגרש
  const formatBracketData = (data: any): BracketData => {
    // ברירת מחדל למקרה שאין נתונים
    if (!data || !data.matches || !Array.isArray(data.matches)) {
      return { rounds: [] };
    }

    // מיון המשחקים לפי סיבובים
    const matchesByRound: Record<number, BracketMatch[]> = {};
    
    data.matches.forEach((match: any) => {
      const round = match.round || 1;
      
      if (!matchesByRound[round]) {
        matchesByRound[round] = [];
      }
      
      // המרת המשחק למבנה הנדרש
      const bracketMatch: BracketMatch = {
        id: match.id,
        round,
        position: match.position || matchesByRound[round].length + 1,
        playerA: match.player1 ? {
          id: match.player1.id,
          name: match.player1.name
        } : undefined,
        playerB: match.player2 ? {
          id: match.player2.id,
          name: match.player2.name
        } : undefined,
        scoreA: match.player1Score !== null ? match.player1Score : undefined,
        scoreB: match.player2Score !== null ? match.player2Score : undefined,
        status: match.status || 'scheduled',
      };
      
      // הגדרת המנצח אם המשחק הסתיים
      if (match.status === 'completed' && match.player1Score !== null && match.player2Score !== null) {
        bracketMatch.winner = match.player1Score > match.player2Score ? 'A' : 'B';
      }
      
      matchesByRound[round].push(bracketMatch);
    });

    // מיון המשחקים לפי המיקום בכל סיבוב
    Object.keys(matchesByRound).forEach(roundKey => {
      const round = parseInt(roundKey);
      matchesByRound[round] = matchesByRound[round].sort((a, b) => a.position - b.position);
    });

    // יצירת המבנה הסופי עם שמות הסיבובים
    const maxRound = Math.max(...Object.keys(matchesByRound).map(r => parseInt(r)));
    
    const rounds = Object.keys(matchesByRound)
      .map(roundKey => {
        const round = parseInt(roundKey);
        let name = `סיבוב ${round}`;
        
        // הגדרת שמות מיוחדים לסיבובים האחרונים
        if (round === maxRound) {
          name = 'גמר';
        } else if (round === maxRound - 1) {
          name = 'חצי גמר';
        } else if (round === maxRound - 2) {
          name = 'רבע גמר';
        }
        
        return {
          round,
          name,
          matches: matchesByRound[round]
        };
      })
      .sort((a, b) => a.round - b.round);
    
    return { rounds };
  };

  return { bracketData, isLoading, error };
} 