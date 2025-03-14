import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { sendRegistrationNotification } from '@/lib/notification-utils';

const prisma = new PrismaClient();

// פונקציה לשליחת התראה למנהל על הרשמה חדשה
async function notifyAdmin(registration: any) {
  try {
    // שליחת התראה למערכת ההתראות
    await sendRegistrationNotification(
      registration.tournamentId,
      registration.name
    );

    console.log(`Admin notification sent for registration: ${registration.id}`);
  } catch (error) {
    console.error('Error sending admin notification:', error);
    // לא מחזירים שגיאה כדי שהתהליך ימשיך גם אם ההתראה נכשלה
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // וידוא שיש את כל השדות הנדרשים
    if (!body.name || !body.phone || !body.email || !body.tournamentId) {
      return NextResponse.json(
        { error: 'חסרים שדות חובה: שם, טלפון, דוא"ל ומזהה טורניר' },
        { status: 400 }
      );
    }

    // בדיקה שהטורניר קיים ופתוח להרשמה
    const tournament = await prisma.tournament.findUnique({
      where: { id: body.tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'הטורניר המבוקש לא נמצא' },
        { status: 404 }
      );
    }

    if (!tournament.registrationOpen) {
      return NextResponse.json(
        { error: 'ההרשמה לטורניר זה סגורה' },
        { status: 400 }
      );
    }

    // בדיקה אם כבר קיימת הרשמה עם אותו דוא"ל או טלפון
    const existingRegistration = await prisma.$queryRaw`
      SELECT * FROM "TournamentRegistration" 
      WHERE "tournamentId" = ${body.tournamentId} 
      AND ("email" = ${body.email} OR "phone" = ${body.phone})
      LIMIT 1
    `;
    
    if (Array.isArray(existingRegistration) && existingRegistration.length > 0) {
      return NextResponse.json(
        { error: 'כבר קיימת הרשמה עם אותו דוא"ל או טלפון' },
        { status: 400 }
      );
    }
    
    // יצירת רשומת הרשמה
    const registrationData: Prisma.TournamentRegistrationCreateInput = {
      tournament: {
        connect: { id: body.tournamentId }
      },
      name: body.name,
      email: body.email,
      phone: body.phone,
      paymentMethod: body.paymentMethod || 'bit',
      paymentStatus: body.paymentStatus || 'pending',
      paymentReference: body.paymentReference || undefined,
      registrationDate: new Date(),
      isApproved: false,
    };
    
    const registration = await prisma.tournamentRegistration.create({
      data: registrationData
    });

    // שליחת התראה למנהל
    notifyAdmin(registration).catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'ההרשמה התקבלה בהצלחה',
      registrationId: registration.id,
    });
  } catch (error) {
    console.error('Error handling tournament registration:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בתהליך ההרשמה' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const authHeader = request.headers.get('Authorization');

    // בדיקת הרשאות מנהל - בדיקה פשוטה למטרות ההדגמה
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'חסרות הרשאות מנהל' },
        { status: 401 }
      );
    }

    // פיצול לשאילתת חיפוש
    const whereClause: Prisma.TournamentRegistrationWhereInput = tournamentId 
      ? { tournamentId } 
      : {};

    const registrations = await prisma.tournamentRegistration.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error fetching tournament registrations:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בקבלת רשימת הנרשמים' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, isApproved, paymentStatus } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'חסר מזהה הרשמה' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'חסרות הרשאות מנהל' },
        { status: 401 }
      );
    }

    // מציאת ההרשמה המבוקשת
    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'הרשמה לא נמצאה' },
        { status: 404 }
      );
    }

    // עדכון פרטי ההרשמה
    const updateData: Prisma.TournamentRegistrationUpdateInput = {};
    
    if (isApproved !== undefined) {
      updateData.isApproved = isApproved;
    }
    
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }
    
    const updatedRegistration = await prisma.tournamentRegistration.update({
      where: { id },
      data: updateData,
    });

    // אם אושרה ההרשמה, יוצרים שחקן חדש או מוסיפים קיים לטורניר
    if (isApproved === true && registration.isApproved === false) {
      // בדיקה אם השחקן כבר קיים לפי המייל או הטלפון
      const existingPlayer = await prisma.player.findFirst({
        where: {
          OR: [
            { email: registration.email },
            { phone: registration.phone }
          ]
        },
      });

      // מזהה השחקן - או קיים או חדש שיווצר
      let playerId;

      // אם השחקן לא קיים, יוצרים שחקן חדש
      if (!existingPlayer) {
        const newPlayer = await prisma.player.create({
          data: {
            name: registration.name,
            email: registration.email,
            phone: registration.phone,
            rating: 1000, // דירוג התחלתי
          },
        });
        playerId = newPlayer.id;
      } else {
        playerId = existingPlayer.id;
      }

      // בדיקה אם השחקן כבר בטורניר
      const playerInTournament = await prisma.tournament.findFirst({
        where: {
          id: registration.tournamentId,
          players: {
            some: {
              id: playerId
            }
          }
        }
      });

      // אם השחקן לא בטורניר, מוסיפים אותו
      if (!playerInTournament) {
        await prisma.tournament.update({
          where: { id: registration.tournamentId },
          data: {
            players: {
              connect: { id: playerId }
            }
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'סטטוס ההרשמה עודכן בהצלחה',
      registration: updatedRegistration,
    });
  } catch (error) {
    console.error('Error updating tournament registration:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בעדכון סטטוס ההרשמה' },
      { status: 500 }
    );
  }
} 