# מדריך ליצירת שלב נוק-אאוט בטורניר

בשל בעיית תצוגה בלחצן יצירת שלב הנוק-אאוט, הכנו מדריך זה המסביר כיצד ליצור את השלב באמצעות קונסולת הדפדפן.

## שלבים ליצירת שלב נוק-אאוט:

1. **התחברו למערכת כמנהל:**
   - יש להתחבר למערכת עם סיסמת המנהל (8891)
   
2. **פתחו את דף הטורניר הרצוי:**
   - נווטו לדף של הטורניר בו תרצו ליצור שלב נוק-אאוט

3. **פתחו את קונסולת הדפדפן:**
   - בכרום/ספארי: לחצו על `F12` או `Cmd+Alt+I` (מק) / `Ctrl+Shift+I` (ווינדוס)
   - בחרו בלשונית "Console" (קונסולה)

4. **העתיקו והדביקו את הקוד הבא:**
   ```javascript
   async function testGenerateKnockout(tournamentId) {
     if (!tournamentId) {
       console.error('No tournament ID provided');
       return;
     }
     
     try {
       // Check if we're in browser environment
       if (typeof window === 'undefined') {
         console.error("Not in browser environment");
         return;
       }
       
       // Check if user is authenticated and is admin
       const isAdmin = localStorage.getItem('isAdmin') === 'true';
       if (!isAdmin) {
         console.error("Not authenticated as admin");
         return;
       }
       
       console.log("Generating knockout stage...");
       
       // Get admin token from localStorage
       const adminToken = localStorage.getItem('adminToken');
       
       if (!adminToken) {
         console.error("No admin token found");
         return;
       }
       
       console.log('Using admin token:', adminToken);
       
       // Try using both header and query parameter for maximum compatibility
       const response = await fetch(`/api/tournaments/${tournamentId}/generate-knockout?token=${encodeURIComponent(adminToken)}`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${adminToken}`,
         }
       });
       
       console.log('Response status:', response.status);
       
       // Handle non-JSON responses
       const contentType = response.headers.get("content-type");
       if (!contentType || !contentType.includes("application/json")) {
         console.error("Server returned non-JSON response:", await response.text());
         return;
       }
       
       let data;
       try {
         data = await response.json();
       } catch (jsonError) {
         console.error('Error parsing JSON response:', jsonError);
         return;
       }
       
       if (!response.ok) {
         console.error(data?.error || "Error creating knockout stage");
         if (data?.details) {
           console.error("Server error details:", data.details);
         }
         return;
       }
       
       console.log("Knockout stage created successfully");
       console.log("Response data:", data);
       
       // Reload the page to see the new knockout matches
       window.location.reload();
     } catch (error) {
       console.error("Error:", error);
     }
   }
   ```

5. **מצאו את מזהה הטורניר:**
   - כתובת הטורניר נראית בדרך כלל כך: `http://your-site.com/tournaments/YOUR-TOURNAMENT-ID`
   - העתיקו את המזהה (החלק האחרון בכתובת)

6. **הפעילו את הפונקציה:**
   - כתבו בקונסולה את הפקודה הבאה, תוך החלפת YOUR-TOURNAMENT-ID במזהה שהעתקתם:
   ```javascript
   testGenerateKnockout('YOUR-TOURNAMENT-ID')
   ```

7. **בדקו את התוצאות:**
   - אם הכל עבד כראוי, תראו הודעת הצלחה בקונסולה והדף יטען מחדש
   - שלב הנוק-אאוט החדש אמור להופיע בדף

## פתרון בעיות נפוצות:

- **שגיאת 401 (Unauthorized):** ודאו שהתחברתם כמנהל. נסו להתחבר מחדש למערכת.
  
- **"No admin token found":** התנתקו והתחברו מחדש למערכת כדי ליצור טוקן חדש.

- **שגיאות אחרות:** צרו קשר עם מנהל המערכת ושתפו את הודעת השגיאה המלאה מהקונסולה.

בהצלחה! 