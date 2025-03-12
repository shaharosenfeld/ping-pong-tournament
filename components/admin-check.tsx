"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ShieldAlert, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"
import { useAuth } from "@/app/hooks/use-auth"

export default function AdminCheck({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAdmin, adminToken, refreshAuthState } = useAuth() // משתמשים ב-hook האימות לבדיקת הרשאות
  const [accessState, setAccessState] = useState<'loading' | 'allowed' | 'denied'>('loading')
  
  // פונקציה זו תבצע רענון של מצב האימות מה-localStorage
  // היא תתבצע בכל פעם שהרכיב הזה נטען, רגע לפני הבדיקה
  // זה יעזור במקרים בהם המצב הסטייטי של הוק האימות לא מסונכרן עם ה-localStorage
  useEffect(() => {
    if (typeof refreshAuthState === 'function') {
      console.log("AdminCheck: מרענן מצב אימות")
      refreshAuthState()
    }
  }, [refreshAuthState])
  
  useEffect(() => {
    const checkAdmin = () => {
      try {
        if (typeof window === 'undefined') return // אם אנחנו ב-SSR, חזור
        
        console.log("AdminCheck: בודק הרשאות מנהל")
        
        // גם בדיקה מהוק וגם בדיקה ישירה מה-localStorage
        const isAdminFromStorage = localStorage.getItem('isAdmin') === 'true'
        const hasToken = !!localStorage.getItem('adminToken')
        
        console.log(`AdminCheck: isAdmin=${isAdmin}, isAdminFromStorage=${isAdminFromStorage}, hasToken=${hasToken}`)
        
        // שיפור הבדיקה - מספיק אחד מהתנאים, אבל צריך שיהיה גם טוקן
        // בנוסף, נוסיף רענון של האימות אם מזהים אי התאמה
        if ((isAdmin || isAdminFromStorage) && hasToken) {
          console.log("AdminCheck: גישת מנהל אושרה")
          
          // עדכון של localStorage אם חסר ושל הוק האימות במקביל
          if (isAdmin && !isAdminFromStorage) {
            localStorage.setItem('isAdmin', 'true')
          } else if (!isAdmin && isAdminFromStorage && typeof refreshAuthState === 'function') {
            refreshAuthState()
          }
          
          setAccessState('allowed')
        } else {
          console.log("AdminCheck: אין הרשאות מנהל")
          
          // הפעם, אנחנו לא נמחק את ה-localStorage באגרסיביות אלא רק אם יש בעיה ברורה
          // אם אין סתירה פנימית בין ה-isAdmin ל-hasToken אז אין צורך למחוק
          if ((isAdmin && !hasToken) || (!isAdmin && !isAdminFromStorage && hasToken)) {
            console.log("AdminCheck: יש סתירה באימות - מנקה נתונים")
            localStorage.removeItem('isAdmin')
            localStorage.removeItem('adminToken')
          }
          
          setAccessState('denied')
        }
      } catch (error) {
        console.error("AdminCheck error:", error)
        setAccessState('denied')
      }
    }
    
    // הגדלת זמן השהייה כדי לתת לכל המערכת זמן לטעון נתונים מה-localStorage
    const timer = setTimeout(checkAdmin, 500)
    return () => clearTimeout(timer)
  }, [isAdmin, refreshAuthState, router])
  
  // בזמן הטעינה, מציגים אנימציית טעינה אבל רק לזמן קצר יחסית
  // המטרה - למנוע הבהובים וניתורים בהכנסה ללוח הבקרה
  if (accessState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
        <p className="text-blue-600">טוען לוח בקרה...</p>
      </div>
    )
  }
  
  // במקרה של בעיית הרשאה, ננסה גם להפנות למסך ההתחברות עם פרמטר החזרה
  if (accessState === 'denied') {
    if (typeof window !== 'undefined') {
      // הוספת תסריט התחברות שמשתמש ב-window.location במקום router
      // זה יגרום לרענון מלא של הדף, אבל עם cookie וזהות חדשים
      const loginScript = setTimeout(() => {
        console.log("AdminCheck: מפנה לדף התחברות עם returnTo", pathname)
        window.location.href = `/login?returnTo=${encodeURIComponent(pathname)}`
      }, 300)
      
      // מחזירים רכיב ביניים בזמן ההפניה
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
          <p className="text-blue-600">מפנה לדף התחברות...</p>
        </div>
      )
    }
    
    // אם מסיבה כלשהי הקוד לעיל לא מתבצע, מציגים גם את טופס ההפניה הרגיל
    return (
      <div
        dir="rtl"
        className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-b from-blue-50 to-white"
      >
        <div className="bg-red-100 p-6 rounded-full mb-6">
          <ShieldAlert className="h-16 w-16 text-red-600" />
        </div>
        <h2 className="text-2xl font-medium text-red-700 mb-4">גישה מוגבלת למנהלים בלבד</h2>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          עליך להתחבר כמנהל כדי לגשת לדף זה. 
          לחץ על הכפתור מטה כדי לעבור לדף ההתחברות.
        </p>
        <Link href={`/login?returnTo=${encodeURIComponent(pathname)}`}>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <LogIn className="h-4 w-4" />
            התחבר כמנהל
          </Button>
        </Link>
      </div>
    )
  }
  
  // אם יש הרשאה, מציגים את התוכן
  return <>{children}</>
}

