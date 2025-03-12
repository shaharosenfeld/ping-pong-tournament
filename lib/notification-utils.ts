// מודול פשוט לניהול התראות במערכת
// ניתן להרחיב בעתיד עם אינטגרציות נוספות לשליחת התראות

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type NotificationPayload = {
  type: string;
  title: string;
  message: string;
  data?: any;
};

// פונקציה גנרית לשליחת התראות
// כרגע מבצעת רק רישום ל-console, אך ניתן להרחיב אותה בעתיד
export async function sendNotification(notification: NotificationPayload): Promise<boolean> {
  try {
    console.log(`[NOTIFICATION] ${notification.type.toUpperCase()}: ${notification.title}`);
    console.log(`[NOTIFICATION] Message: ${notification.message}`);
    
    if (notification.data) {
      console.log(`[NOTIFICATION] Data:`, notification.data);
    }
    
    // כאן ניתן להוסיף בעתיד אינטגרציות נוספות, למשל:
    // - שליחה לשירות התראות חיצוני
    // - שמירה בדאטהבייס של התראות
    // - פעולות נוספות בהתאם לסוג ההתראה
    
    return true;
  } catch (error) {
    console.error('[NOTIFICATION ERROR]', error);
    return false;
  }
}

// פונקציה לבדיקה אם יש התראות חדשות (לשימוש עתידי)
export async function checkForNotifications(userId: string): Promise<NotificationPayload[]> {
  // טיפול במצב בו אין התראות חדשות - מחזיר מערך ריק
  return [];
}

/**
 * הפונקציה שולחת התראה לאדמין על תשלום חדש
 */
export async function sendPaymentNotification(tournamentId: string, playerName: string, paymentDetails: any) {
  try {
    // יצירת התראה חדשה במערכת
    await prisma.notification.create({
      data: {
        title: `תשלום חדש התקבל`,
        message: `שחקן ${playerName} שילם עבור טורניר #${tournamentId}. פרטי תשלום: ${JSON.stringify(paymentDetails)}`,
        type: 'payment',
        read: false
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send payment notification:', error);
    return { success: false, error };
  }
}

/**
 * נרשם שחקן חדש לטורניר - שליחת התראה
 */
export async function sendRegistrationNotification(tournamentId: string, playerName: string) {
  try {
    // יצירת התראה חדשה במערכת
    await prisma.notification.create({
      data: {
        title: `רישום חדש לטורניר`,
        message: `שחקן ${playerName} נרשם לטורניר #${tournamentId}`,
        type: 'registration',
        read: false
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send registration notification:', error);
    return { success: false, error };
  }
}

/**
 * הפונקציה שולחת מייל - למימוש עתידי
 */
export async function sendEmail(to: string, subject: string, text: string) {
  try {
    console.log('Email would be sent:', { to, subject, text });
    // שמור למימוש עתידי עם nodemailer
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

/**
 * הפונקציה שולחת הודעת SMS - למימוש עתידי
 */
export async function sendSMS(phoneNumber: string, message: string) {
  try {
    console.log('SMS would be sent:', { phoneNumber, message });
    // שמור למימוש עתידי
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return { success: false, error };
  }
} 