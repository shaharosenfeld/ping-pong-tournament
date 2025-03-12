// מודול פשוט לניהול התראות במערכת
// ניתן להרחיב בעתיד עם אינטגרציות נוספות לשליחת התראות

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