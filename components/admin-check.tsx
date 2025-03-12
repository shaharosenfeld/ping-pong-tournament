"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { ShieldAlert, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"

export default function AdminCheck({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [accessState, setAccessState] = useState<'loading' | 'allowed' | 'denied'>('loading')
  
  useEffect(() => {
    // בדיקה פשוטה לאחר השהייה קצרה
    const timer = setTimeout(() => {
      try {
        // בדיקה פשוטה - האם יש טוקן בלוקאל סטורג׳
        const hasToken = !!localStorage.getItem('adminToken')
        console.log("AdminCheck: בדיקה פשוטה - האם יש טוקן:", hasToken)
        
        if (hasToken) {
          console.log("AdminCheck: גישה אושרה בבדיקה פשוטה")
          // וידוא ששדה isAdmin קיים גם הוא
          localStorage.setItem('isAdmin', 'true')
          setAccessState('allowed')
        } else {
          console.log("AdminCheck: אין גישה בבדיקה פשוטה")
          setAccessState('denied')
        }
      } catch (error) {
        console.error("AdminCheck error:", error)
        setAccessState('denied')
      }
    }, 700)
    
    return () => clearTimeout(timer)
  }, [])
  
  // בזמן טעינה מציגים אנימצית טעינה
  if (accessState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
        <p className="text-blue-600">טוען לוח בקרה...</p>
      </div>
    )
  }
  
  // במקרה של בעיית הרשאה - מציגים כפתור התחברות
  if (accessState === 'denied') {
    return (
      <div dir="rtl" className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-red-100 p-6 rounded-full mb-6">
          <ShieldAlert className="h-16 w-16 text-red-600" />
        </div>
        <h2 className="text-2xl font-medium text-red-700 mb-4">גישה מוגבלת למנהלים בלבד</h2>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          עליך להתחבר כמנהל כדי לגשת לדף זה.
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

