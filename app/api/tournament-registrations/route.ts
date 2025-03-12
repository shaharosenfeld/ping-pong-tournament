import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendNotification } from '@/lib/notification-utils';
import { io } from 'socket.io-client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// פונקציה לשליחת התראה למנהל על הרשמה חדשה
async function notifyAdmin(registration: any) {
  try {
    // שליחת אימייל למנהל (אם מוגדר)
    if (process.env.ADMIN_EMAIL) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const tournament = await prisma.tournament.findUnique({
        where: { id: registration.tournamentId },
        select: { name: true },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `הרשמה חדשה לטורניר ${tournament?.name || registration.tournamentId}`,
        html: `
          <div dir="rtl">
            <h2>הרשמה חדשה לטורניר</h2>
            <p><strong>שם הטורניר:</strong> ${tournament?.name || 'לא ידוע'}</p>
            <p><strong>שם הנרשם:</strong> ${registration.name}</p>
            <p><strong>טלפון:</strong> ${registration.phone}</p>
            <p><strong>דוא"ל:</strong> ${registration.email}</p>
            <p><strong>אופן תשלום:</strong> ${registration.paymentMethod === 'bit' ? 'ביט' : 'מזומן'}</p>
            <p><strong>סטטוס תשלום:</strong> ${registration.paymentStatus === 'pending' ? 'ממתין לאישור' : 'טרם שולם'}</p>
            ${registration.paymentReference ? `<p><strong>אסמכתא:</strong> ${registration.paymentReference}</p>` : ''}
            <p><strong>תאריך הרשמה:</strong> ${new Date(registration.registrationDate).toLocaleString('he-IL')}</p>
            <hr />
            <p>לאישור ההרשמה והוספת השחקן לטורניר, יש להיכנס למערכת הניהול.</p>
          </div>
        `,
      });
    }

    // שליחת התראה למערכת ההתראות (לוח מחוונים)
    // יש להגדיר את המנגנון הספציפי בהתאם לצורך
    if (typeof sendNotification === 'function') {
      await sendNotification({
        type: 'registration',
        title: 'הרשמה חדשה לטורניר',
        message: `נרשם חדש: ${registration.name}`,
        data: registration,
      });
    }

    // ניסיון לשליחת התראה בזמן אמת באמצעות Socket.IO אם מוגדר
    if (process.env.SOCKET_URL) {
      const socket = io(process.env.SOCKET_URL);
      socket.emit('new-registration', registration);
      socket.disconnect();
    }

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
    const existingRegistration = await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentId: body.tournamentId,
        OR: [
          { email: body.email },
          { phone: body.phone }
        ]
      }
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'כבר קיימת הרשמה עם פרטים אלו לטורניר זה' },
        { status: 400 }
      );
    }

    // יצירת רשומת הרשמה
    const registration = await prisma.tournamentRegistration.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        tournamentId: body.tournamentId,
        paymentMethod: body.paymentMethod || 'bit',
        paymentStatus: body.paymentStatus || 'pending',
        paymentReference: body.paymentReference || null,
        registrationDate: body.registrationDate || new Date().toISOString(),
        isApproved: false,
      },
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

// קבלת כל ההרשמות לטורניר מסוים (למנהלים בלבד)
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
    let whereClause: any = {};
    
    if (tournamentId) {
      whereClause.tournamentId = tournamentId;
    }

    const registrations = await prisma.tournamentRegistration.findMany({
      where: whereClause,
      orderBy: { registrationDate: 'desc' },
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

// עדכון סטטוס הרשמה והוספת שחקן לטורניר
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
    const updatedRegistration = await prisma.tournamentRegistration.update({
      where: { id },
      data: {
        isApproved: isApproved !== undefined ? isApproved : registration.isApproved,
        paymentStatus: paymentStatus || registration.paymentStatus,
      },
    });

    // אם אושרה ההרשמה, יוצרים שחקן חדש או מוסיפים קיים לטורניר
    if (isApproved === true && !registration.isApproved) {
      // בדיקה אם השחקן כבר קיים לפי המייל או הטלפון
      let player = await prisma.player.findFirst({
        where: {
          OR: [
            { email: registration.email },
            { phone: registration.phone }
          ]
        }
      });

      // אם השחקן לא קיים, יוצרים שחקן חדש
      if (!player) {
        player = await prisma.player.create({
          data: {
            name: registration.name,
            email: registration.email,
            phone: registration.phone,
            rating: 1000, // דירוג התחלתי
          },
        });
      }

      // בדיקה אם השחקן כבר בטורניר
      const playerInTournament = await prisma.tournament.findFirst({
        where: {
          id: registration.tournamentId,
          players: {
            some: {
              id: player.id
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
              connect: { id: player.id }
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