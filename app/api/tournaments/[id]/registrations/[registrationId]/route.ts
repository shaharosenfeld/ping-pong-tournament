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
    const { isApproved, paymentStatus } = body;
    
    if (isApproved === undefined && paymentStatus === undefined) {
      return NextResponse.json(
        { error: 'Missing isApproved or paymentStatus field' },
        { status: 400 }
      );
    }
    
    // הכנת אובייקט עם נתוני העדכון
    const updateData: any = {};
    
    if (isApproved !== undefined) {
      updateData.isApproved = !!isApproved;
    }
    
    if (paymentStatus !== undefined) {
      updateData.paymentStatus = paymentStatus;
    }
    
    // עדכון הרישום
    const updatedRegistration = await prisma.tournamentRegistration.update({
      where: { 
        id: registrationId,
        tournamentId: tournamentId
      },
      data: updateData,
      include: {
        player: true
      }
    });
    
    // אם אישרנו רישום, מוסיפים אימייל לתור שליחה
    if (isApproved === true && updatedRegistration.isApproved) {
      // לוגיקה לשליחת אימייל אישור הרשמה
      console.log(`Registration ${registrationId} approved - should send email to ${updatedRegistration.email}`);
      
      // כאן ניתן להוסיף לוגיקה לשליחת מייל, כגון:
      // await sendApprovalEmail(updatedRegistration);
    }
    
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