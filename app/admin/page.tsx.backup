"use client"

import React, { useState, useEffect } from 'react'
// הסרת הייבוא של הקובץ שאינו קיים
// import AdminDashboard from './dashboard'

export default function AdminPage() {
  const [isReady, setIsReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  
  useEffect(() => {
    // בדיקה ישירה של localStorage
    if (typeof window !== 'undefined') {
      const hasAdminFlag = localStorage.getItem('isAdmin') === 'true'
      const hasAdminToken = !!localStorage.getItem('adminToken')
      
      console.log("Admin page check:", { hasAdminFlag, hasAdminToken })
      
      if (hasAdminFlag && hasAdminToken) {
        setIsAdmin(true)
      }
      
      setIsReady(true)
    }
  }, [])

  // כשהדף עדיין לא מוכן, נציג רק מסך טעינה בסיסי
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-blue-600">טוען...</p>
      </div>
    )
  }

  // אם המשתמש הוא מנהל, הוא כבר יוכל לראות את התוכן
  // ה-AdminCheck בתוך ה-layout עדיין יפעל, אבל לא יגרום לבעיות
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">לוח הבקרה למנהל</h1>
      
      {/* כאן נכנס תוכן לוח הבקרה */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">סטטיסטיקות</h2>
          <p>כאן יוצגו סטטיסטיקות המערכת</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">משחקים אחרונים</h2>
          <p>רשימת המשחקים האחרונים שהתקיימו</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">פעולות מהירות</h2>
          <p>כפתורים לפעולות נפוצות</p>
        </div>
      </div>
    </div>
  )
}

