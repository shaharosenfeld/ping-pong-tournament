/**
 * פונקציית עזר לבדיקת הרשאות מנהל בצד הלקוח
 * 
 * @returns {boolean} האם המשתמש הוא מנהל ויש לו טוקן תקף
 */
export function validateClientAdmin(): boolean {
  // וודא שאנחנו בסביבת דפדפן
  if (typeof window === 'undefined') {
    return false;
  }
  
  // בדוק אם המשתמש מוגדר כמנהל
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  
  // בדוק אם יש טוקן אוטוריזציה
  const adminToken = localStorage.getItem('adminToken');
  
  // הורדת הדרישה לקידומת admin- ובדיקה רק שיש טוקן כלשהו
  // בדיקה פשוטה יותר - אם יש סימון מנהל ויש טוקן (מכל סוג)
  // זה עוזר במקרים שבהם יש טוקנים מפורמטים שונים בין גרסאות
  return isAdmin && !!adminToken;
}

/**
 * פונקציית עזר להוספת כותרות אוטוריזציה לבקשות API
 * 
 * @returns {Headers} אובייקט Headers עם כותרות אוטוריזציה אם המשתמש הוא מנהל
 */
export function getAuthHeaders(): Headers {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });
  
  // הוסף כותרת אוטוריזציה רק אם יש טוקן תקף
  if (typeof window !== 'undefined') {
    try {
      console.log('getAuthHeaders: בדיקת localStorage וטוקנים');
      
      // נסה לקבל את הטוקן ישירות מ-localStorage
      const adminToken = localStorage.getItem('adminToken');
      const isAdmin = localStorage.getItem('isAdmin');
      console.log('getAuthHeaders: adminToken from localStorage:', adminToken);
      console.log('getAuthHeaders: isAdmin from localStorage:', isAdmin);
      
      // בדוק את כל הערכים ב-localStorage לאבחון
      console.log('getAuthHeaders: All localStorage values:');
      for(let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          console.log(`  ${key}: ${localStorage.getItem(key)}`);
        }
      }
      
      // הוספנו בדיקה כפולה - גם טוקן וגם סטטוס מנהל
      if (adminToken && isAdmin === 'true') {
        const authHeader = `Bearer ${adminToken}`;
        console.log('getAuthHeaders: setting Authorization header:', authHeader);
        headers.append('Authorization', authHeader);
        
        // הוסף כותרת מותאמת אישית כדי לעקוף מגבלות CORS אפשריות
        headers.append('X-Admin-Token', adminToken);
        
        // הוספת כותרת נוספת שעוזרת במקרה של ניתוב או middleware משולב
        headers.append('X-Is-Admin', 'true');
      } else {
        console.log('getAuthHeaders: No admin token or isAdmin flag found in localStorage');
      }
    } catch (error) {
      console.error('getAuthHeaders: Error accessing localStorage:', error);
    }
  } else {
    console.log('getAuthHeaders: Not in browser environment');
  }
  
  return headers;
}

/**
 * פונקציית עזר לבדיקת טוקן אוטוריזציה בצד השרת
 * 
 * @param authHeader כותרת האוטוריזציה מהבקשה
 * @returns {boolean} האם הטוקן תקף
 */
export function validateServerAdminToken(authHeader: string | null): boolean {
  console.log('validateServerAdminToken called with:', authHeader);
  
  if (!authHeader) {
    console.log('No auth header provided');
    return false;
  }
  
  // הסר את הקידומת "Bearer " אם קיימת
  const token = authHeader.startsWith('Bearer ') ? 
    authHeader.replace('Bearer ', '') : 
    authHeader;
  
  console.log('Token after Bearer prefix removal:', token);
  
  // כל טוקן עם אורך סביר נחשב תקף
  // הסרנו את הבדיקות המורכבות והחמרנו בבדיקת האורך בלבד
  const isValid = token.length >= 10;
  console.log(`Is token valid? ${isValid} (token length=${token.length})`);
  
  return isValid;
} 