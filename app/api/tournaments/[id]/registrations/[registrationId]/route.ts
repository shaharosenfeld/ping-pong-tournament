import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAdminAuth } from '@/lib/admin-utils'

export async function PATCH(
  request: Request, 
  { params }: { params: { id: string, registrationId: string } }
) {
  // Params must be awaited in Next.js 15.1.0
  const unwrappedParams = await params;
  const tournamentId = unwrappedParams.id;
  const registrationId = unwrappedParams.registrationId;

  try {
    console.log(`PATCH /api/tournaments/${tournamentId}/registrations/${registrationId}: Updating registration`);
    
    // אימות הרשאות מנהל
    if (!validateAdminAuth(request)) {
      console.error('PATCH /api/tournaments/.../registrations/...: Authentication failed');
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      );
    }
    
    // קבלת נתוני העדכון מהבקשה
    const body = await request.json();
    const { isApproved } = body;
    
    if (isApproved === undefined) {
      return NextResponse.json(
        { error: 'Missing isApproved field' },
        { status: 400 }
      );
    }
    
    // עדכון הרישום
    const updatedRegistration = await prisma.tournamentRegistration.update({
      where: { 
        id: registrationId,
        tournamentId: tournamentId
      },
      data: {
        isApproved: !!isApproved
      },
      include: {
        player: true
      }
    });
    
    return NextResponse.json({
      success: true,
      registration: updatedRegistration
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { error: 'Failed to update registration' },
      { status: 500 }
    );
  }
} 