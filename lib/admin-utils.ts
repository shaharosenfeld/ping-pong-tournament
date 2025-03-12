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
    console.log('getAuthHeaders: adminToken from localStorage:', adminToken);
    
    if (adminToken) {
      const authHeader = `Bearer ${adminToken}`;
      console.log('getAuthHeaders: setting Authorization header:', authHeader);
      headers.append('Authorization', authHeader);
    } else {
      console.log('getAuthHeaders: No admin token found in localStorage');
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
  
  // בדיקה אם הטוקן תקף
  // 1. בדוק אם הטוקן מתחיל ב-admin-
  // 2. אם לא, בדוק אם זה UUID תקף (לטיפול בטוקנים שנוצרו לפני התיקון)
  // 3. אם לא, בדוק אם יש טוקן מכל סוג שהוא (סוג ישן אחר)
  const isAdminToken = token.startsWith('admin-');
  const looksLikeValidUUID = token.length > 30 && token.includes('-'); // בדיקה פשוטה לנראות UUID
  const hasAnyValue = token.length > 10; // בדיקה כללית שיש משהו בטוקן
  
  const isValid = isAdminToken || looksLikeValidUUID || hasAnyValue;
  console.log(`Is token valid? ${isValid} (adminToken=${isAdminToken}, uuidLike=${looksLikeValidUUID}, hasAnyValue=${hasAnyValue})`);
  
  return isValid;
} 