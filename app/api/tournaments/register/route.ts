import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// נקודת קצה להרשמה לטורניר
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tournamentId, playerId, email, name } = body
    
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
    const existingRegistration = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_playerId: {
          tournamentId,
          playerId
        }
      }
    })
    
    if (existingRegistration) {
      return NextResponse.json({
        success: false,
        message: 'השחקן כבר רשום לטורניר זה'
      }, { status: 400 })
    }
    
    // יצירת רשומת הרשמה חדשה
    const registration = await prisma.tournamentRegistration.create({
      data: {
        id: uuidv4(),
        tournamentId,
        playerId,
        userEmail: email,
        userName: name,
        paymentStatus: 'pending',
        paymentAmount: tournament.price || 0,
      }
    })
    
    // בדיקה אם השחקן כבר מופיע ברשימת השחקנים של הטורניר, ואם לא - נוסיף אותו
    const playerInTournament = tournament.players.some(p => p.id === playerId)
    
    if (!playerInTournament) {
      // הוספת השחקן לטורניר
      await prisma.tournament.update({
        where: {
          id: tournamentId
        },
        data: {
          players: {
            connect: {
              id: playerId
            }
          }
        }
      })
    }
    
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