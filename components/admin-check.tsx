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
  const { isAdmin } = useAuth() // משתמשים ב-hook האימות לבדיקת הרשאות
  const [accessState, setAccessState] = useState<'loading' | 'allowed' | 'denied'>('loading')
  
  useEffect(() => {
    const checkAdmin = () => {
      try {
        if (typeof window === 'undefined') return // אם אנחנו ב-SSR, חזור
        
        console.log("AdminCheck: בודק הרשאות מנהל")
        
        // גם בדיקה מהוק וגם בדיקה ישירה מה-localStorage
        const isAdminFromStorage = localStorage.getItem('isAdmin') === 'true'
        const hasToken = !!localStorage.getItem('adminToken')
        
        console.log(`AdminCheck: isAdmin=${isAdmin}, isAdminFromStorage=${isAdminFromStorage}, hasToken=${hasToken}`)
        
        // מעדכן את הבדיקה להיות יותר סלחנית - אם אחד מהתנאים מתקיים, נאשר גישה
        // זה מונע מצב של "לופ התחברות" כשיש אי התאמה בין localStorage למצב בהוק
        if ((isAdmin || isAdminFromStorage) && hasToken) {
          console.log("AdminCheck: גישת מנהל אושרה")
          setAccessState('allowed')
          
          // אם יש אי התאמה בין הוק ו-localStorage, נעדכן את localStorage להיות תואם למצב האמיתי
          if (isAdmin && !isAdminFromStorage) {
            localStorage.setItem('isAdmin', 'true')
          }
        } else {
          console.log("AdminCheck: אין הרשאות מנהל, מפנה לדף התחברות")
          // ננקה את ה-localStorage רק אם אין שום סימן להרשאות מנהל כלל
          if (!isAdmin && !isAdminFromStorage && !hasToken) {
            localStorage.removeItem('isAdmin')
            localStorage.removeItem('adminToken')
            console.log("AdminCheck: ניקוי נתוני אימות מ-localStorage")
          }
          setAccessState('denied')
        }
      } catch (error) {
        console.error("AdminCheck error:", error)
        setAccessState('denied')
      }
    }
    
    // הגדרת טיימר ארוך יותר כדי לתת להוק האימות זמן להתעדכן
    const timer = setTimeout(checkAdmin, 300)
    return () => clearTimeout(timer)
  }, [isAdmin, router])
  
  // בזמן הטעינה
  if (accessState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
        <p className="text-blue-600">בודק הרשאות...</p>
      </div>
    )
  }
  
  // אם אין הרשאה
  if (accessState === 'denied') {
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

