"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Shield, AlertTriangle, RefreshCcw } from "lucide-react"
import { validateClientAdmin } from "@/lib/admin-utils"

export default function AdminCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    // מבצע בדיקת מנהל בצד הלקוח בעזרת הפונקציה שעדכנו
    const checkAdmin = () => {
      try {
        const isAdminValid = validateClientAdmin()
        console.log("AdminCheck: Is admin valid?", isAdminValid)
        setIsAdmin(isAdminValid)
      } catch (error) {
        console.error("Error checking admin status:", error)
        setIsAdmin(false)
      }
    }
    
    checkAdmin()
  }, [])

  // פונקציה לניקוי נתוני אימות ומעבר להתחברות מחדש
  const handleClearAuth = () => {
    setIsClearing(true)
    try {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('isAdmin')
      localStorage.removeItem('isAuthenticated')
      
      setTimeout(() => {
        router.push('/login?returnTo=' + encodeURIComponent(window.location.pathname))
      }, 1000)
    } catch (error) {
      console.error('Error clearing auth data:', error)
      setIsClearing(false)
    }
  }

  if (isAdmin === null) {
    // מצב טעינה - בודק הרשאות
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <Shield className="h-12 w-12 text-primary animate-pulse mb-4" />
        <h2 className="text-xl font-semibold mb-2">בודק הרשאות מנהל...</h2>
        <p className="text-muted-foreground">אנא המתן</p>
      </div>
    )
  }

  if (!isAdmin) {
    // אין הרשאות מנהל - הצג הודעת שגיאה ואפשר ניקוי וכניסה מחדש
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">אין הרשאות מנהל</h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          נדרשות הרשאות מנהל כדי לגשת לעמוד זה. נא להתחבר עם חשבון מנהל תקף.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleClearAuth} 
            variant="destructive"
            disabled={isClearing}
            className="flex items-center gap-2"
          >
            {isClearing ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                מנקה נתונים...
              </>
            ) : (
              <>נקה נתוני כניסה והתחבר מחדש</>
            )}
          </Button>
          <Button 
            onClick={() => router.push('/tournaments')}
            variant="outline"
          >
            חזרה לרשימת טורנירים
          </Button>
        </div>
      </div>
    )
  }

  // יש הרשאות מנהל - הצג את הרכיב המקורי
  return <>{children}</>
}

