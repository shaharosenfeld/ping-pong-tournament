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
  
  // בדוק שיש גם הגדרת מנהל וגם טוקן תקף
  return isAdmin && !!adminToken && adminToken.startsWith('admin-');
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
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      headers.append('Authorization', `Bearer ${adminToken}`);
    }
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
  if (!authHeader) return false;
  
  // הסר את הקידומת "Bearer " אם קיימת
  const token = authHeader.startsWith('Bearer ') ? 
    authHeader.replace('Bearer ', '') : 
    authHeader;
  
  // בדוק שהטוקן מתחיל ב-"admin-"
  return !!token && token.startsWith('admin-');
} 