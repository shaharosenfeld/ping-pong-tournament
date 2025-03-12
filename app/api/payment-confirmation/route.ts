import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // וידוא שיש את כל השדות הנדרשים
    if (!body.registrationId || !body.paymentMethod || !body.paymentStatus) {
      return NextResponse.json(
        { error: 'חסרים שדות חובה: מזהה הרשמה, שיטת תשלום, וסטטוס תשלום' },
        { status: 400 }
      );
    }

    // ניסיון לעדכן את רשומת ההרשמה
    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: body.registrationId },
      include: { tournament: true }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'הרשמה זו לא נמצאה במערכת' },
        { status: 404 }
      );
    }

    // עדכון ההרשמה עם פרטי התשלום
    const updatedRegistration = await prisma.tournamentRegistration.update({
      where: { id: body.registrationId },
      data: {
        paymentStatus: body.paymentStatus,
        paymentMethod: body.paymentMethod,
        paymentReference: body.paymentReference || `manual-confirmation-${new Date().toISOString()}`,
        // אם התשלום מאושר, גם ההרשמה מאושרת אוטומטית
        isApproved: body.paymentStatus === 'confirmed' ? true : registration.isApproved
      }
    });

    // בעתיד ניתן להוסיף כאן שליחת אימייל אישור למשתמש

    return NextResponse.json({
      success: true,
      registration: updatedRegistration
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json({
      success: false,
      message: 'אירעה שגיאה באישור התשלום'
    }, { status: 500 });
  }
} 