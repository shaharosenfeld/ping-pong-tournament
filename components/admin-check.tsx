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
  const [redirectCount, setRedirectCount] = useState(0)
  
  // רענון מצב האימות מה-localStorage בעת טעינת הרכיב
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
        console.log("AdminCheck: localStorage.isAdmin =", localStorage.getItem('isAdmin'))
        console.log("AdminCheck: localStorage.adminToken =", localStorage.getItem('adminToken') ? "קיים" : "לא קיים")
        
        // גם בדיקה מהוק וגם בדיקה ישירה מה-localStorage
        const isAdminFromStorage = localStorage.getItem('isAdmin') === 'true'
        const hasToken = !!localStorage.getItem('adminToken')
        
        console.log(`AdminCheck: isAdmin=${isAdmin}, isAdminFromStorage=${isAdminFromStorage}, hasToken=${hasToken}`)
        
        // מספיק אחד מהתנאים, אבל צריך שיהיה גם טוקן
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
          console.log("AdminCheck: אין הרשאות מנהל מספקות")
          
          // בדוק אם זהו ניסיון הפניה חוזר - למניעת לולאות אינסופיות
          if (redirectCount > 0) {
            console.log("AdminCheck: זוהתה הפניה חוזרת, מציג הודעת שגיאה במקום")
            setAccessState('denied')
            return
          }
          
          // הפעם, אנחנו לא נמחק את ה-localStorage באגרסיביות אלא רק אם יש בעיה ברורה
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
    const timer = setTimeout(checkAdmin, 1000)
    return () => clearTimeout(timer)
  }, [isAdmin, refreshAuthState, redirectCount])
  
  // מניעת ניווט אוטומטי וביטול הפניה בזמן טעינה
  if (accessState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
        <p className="text-blue-600">טוען לוח בקרה...</p>
      </div>
    )
  }
  
  // במקרה של בעיית הרשאה
  if (accessState === 'denied') {
    if (redirectCount === 0 && typeof window !== 'undefined') {
      // ניסיון ראשון להפניה
      setRedirectCount(prev => prev + 1)
      console.log("AdminCheck: מפנה לדף התחברות עם returnTo", pathname)
      
      // הוספת עיכוב להפניה כדי למנוע בעיות
      setTimeout(() => {
        window.location.href = `/login?returnTo=${encodeURIComponent(pathname)}`
      }, 800)
      
      // בינתיים מציג הודעת טעינה
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
          <p className="text-blue-600">מפנה לדף התחברות...</p>
        </div>
      )
    }
    
    // מציג הודעת שגיאה אם ההפניה כבר נעשתה או נכשלה
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

