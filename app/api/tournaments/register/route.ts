import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// נקודת קצה להרשמה לטורניר
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tournamentId, playerId, email, name, phone, paymentMethod } = body
    
    if (!tournamentId || !playerId || !email || !name) {
      return NextResponse.json({
        success: false,
        message: 'חסרים פרטים נדרשים'
      }, { status: 400 })
    }
    
    // בדיקה שהטורניר קיים והוא פתוח להרשמה
    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId
      },
      include: {
        players: true
      }
    })
    
    if (!tournament) {
      return NextResponse.json({
        success: false,
        message: 'הטורניר לא נמצא'
      }, { status: 404 })
    }
    
    if (!tournament.registrationOpen) {
      return NextResponse.json({
        success: false,
        message: 'ההרשמה לטורניר סגורה'
      }, { status: 400 })
    }
    
    // בדיקה שהשחקן קיים
    const player = await prisma.player.findUnique({
      where: {
        id: playerId
      }
    })
    
    if (!player) {
      return NextResponse.json({
        success: false,
        message: 'השחקן לא נמצא'
      }, { status: 404 })
    }
    
    // בדיקה שהשחקן לא כבר רשום לטורניר
    // שימוש בfindFirst במקום findUnique עם מפתח מורכב
    const existingRegistration = await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentId,
        playerId
      }
    })
    
    if (existingRegistration) {
      return NextResponse.json({
        success: false,
        message: 'השחקן כבר רשום לטורניר זה'
      }, { status: 400 })
    }
    
    // קביעת שיטת התשלום הנבחרת
    // אם לא נבחרה שיטת תשלום, השתמש בביט כברירת מחדל
    const selectedPaymentMethod = paymentMethod || 'bit';
    
    // וידוא שיש נתונים עבור שיטת התשלום הנבחרת
    if (selectedPaymentMethod === 'bit' && !tournament.bitPaymentPhone) {
      return NextResponse.json({
        success: false,
        message: 'לא ניתן להשתמש בביט כשיטת תשלום עבור טורניר זה (חסר מספר טלפון)'
      }, { status: 400 })
    }
    
    // בדיקה מותנית עבור תשלום Paybox
    // אנחנו בודקים אם השיטה היא Paybox ואם נמצא שדה Paybox בטורניר
    if (selectedPaymentMethod === 'paybox' && !(tournament as any).payboxPaymentLink) {
      return NextResponse.json({
        success: false,
        message: 'לא ניתן להשתמש ב-Paybox כשיטת תשלום עבור טורניר זה (חסר קישור)'
      }, { status: 400 })
    }
    
    // יצירת רשומת הרשמה חדשה
    const registration = await prisma.tournamentRegistration.create({
      data: {
        id: uuidv4(),
        tournamentId,
        playerId,
        name,
        email,
        phone: phone || "",
        paymentMethod: selectedPaymentMethod,
        paymentStatus: 'pending',
        isApproved: false,
      }
    })
    
    // נשים לב: איננו מוסיפים את השחקן לטורניר כאן
    // התוספת של שחקנים וההגרלה של המשחקים תתבצע רק כשסוגרים את ההרשמה
    
    return NextResponse.json({
      success: true,
      registration
    })
  } catch (error) {
    console.error('Error registering to tournament:', error)
    return NextResponse.json({
      success: false,
      message: 'אירעה שגיאה בתהליך ההרשמה'
    }, { status: 500 })
  }
} 