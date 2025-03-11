import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// סיסמת מנהל פשוטה. בפרויקט אמיתי, צריך לאחסן באופן מאובטח במסד נתונים או בסביבה
const ADMIN_PASSWORD = '8891'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ 
        success: false, 
        error: 'סיסמה לא הוזנה' 
      }, { status: 400 })
    }

    // בדיקת הסיסמה
    if (password !== ADMIN_PASSWORD) {
      console.log('Invalid admin password attempt')
      return NextResponse.json({ 
        success: false, 
        error: 'סיסמה שגויה' 
      }, { status: 401 })
    }

    // יצירת טוקן מנהל
    const token = `admin-${uuidv4()}`

    return NextResponse.json({
      success: true,
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'שגיאה בתהליך ההתחברות' 
    }, { status: 500 })
  }
} 