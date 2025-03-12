import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAdminAuth } from '@/lib/admin-utils' // ודא שיש לך פונקציה כזו ביישום שלך

export async function POST(request: Request, { params }: { params: { id: string } }) {
  // Params must be awaited in Next.js 15.1.0
  const unwrappedParams = await params;
  const id = unwrappedParams.id;

  try {
    console.log('POST /api/tournaments/[id]/close-registration: Starting request for tournament ID:', id);
    
    // לוג כל הכותרות הקיימות בבקשה
    console.log('POST /api/tournaments/[id]/close-registration: All request headers:');
    request.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // אימות הרשאות מנהל
    if (!validateAdminAuth(request)) {
      console.error('POST /api/tournaments/[id]/close-registration: Authentication failed');
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      );
    }
    
    // בדיקה שהטורניר קיים
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { 
        players: true,
        registrations: {
          include: {
            player: true
          }
        }
      }
    });
    
    if (!tournament) {
      return NextResponse.json(
        { error: 'הטורניר לא נמצא' },
        { status: 404 }
      );
    }
    
    if (!tournament.registrationOpen) {
      return NextResponse.json(
        { error: 'ההרשמה לטורניר כבר סגורה' },
        { status: 400 }
      );
    }
    
    // סגירת ההרשמה לטורניר
    await prisma.tournament.update({
      where: { id },
      data: {
        registrationOpen: false
      }
    });
    
    // איסוף רשימת שחקנים מאושרים מהרישומים
    const approvedRegistrations = tournament.registrations.filter(reg => reg.isApproved);
    const approvedPlayerIds = approvedRegistrations.map(reg => reg.playerId);
    
    // הוספת שחקנים מאושרים לטורניר (אם הם לא כבר בתוכו)
    const existingPlayerIds = tournament.players.map(player => player.id);
    const newPlayerIds = approvedPlayerIds.filter(playerId => !existingPlayerIds.includes(playerId));
    
    if (newPlayerIds.length > 0) {
      await prisma.tournament.update({
        where: { id },
        data: {
          players: {
            connect: newPlayerIds.map(playerId => ({ id: playerId }))
          }
        }
      });
    }
    
    // יצירת משחקים בהתאם לפורמט הטורניר
    if (newPlayerIds.length > 0) {
      // ייבוא פונקציית יצירת המשחקים מהתיקייה הנכונה
      const { createTournamentMatches } = await import('@/lib/tournament-utils');
      
      // עדכון כל השחקנים בטורניר
      const updatedTournament = await prisma.tournament.findUnique({
        where: { id },
        include: { players: true }
      });
      
      if (updatedTournament) {
        // יצירת משחקים
        await createTournamentMatches(updatedTournament);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'ההרשמה נסגרה והמשחקים נוצרו בהצלחה'
    });
    
  } catch (error) {
    console.error('Error closing registration:', error);
    return NextResponse.json(
      { error: 'Failed to close registration' },
      { status: 500 }
    );
  }
} 