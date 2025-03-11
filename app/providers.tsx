"use client"

import { useState, useEffect } from 'react'
import { AuthProvider } from './hooks/use-auth'

/**
 * AuthWrap - קומפוננטה שמטפלת בטעינת AuthProvider רק בצד הלקוח
 * פותרת את הבעיה של התנגשות בין "use client" ומטא-דאטה
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // כאשר מדובר בצד השרת, אנחנו פשוט מחזירים את ה-children ללא AuthProvider
  if (!mounted) {
    return <>{children}</>
  }

  // בצד הלקוח, אנחנו עוטפים את ה-children ב-AuthProvider
  return <AuthProvider>{children}</AuthProvider>
} 