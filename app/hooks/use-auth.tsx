"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { toast } from "sonner"

interface AuthContextType {
  isAdmin: boolean
  adminToken: string | null
  login: (password: string) => Promise<boolean>
  logout: () => void
  refreshAuthState: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  adminToken: null,
  login: async () => false,
  logout: () => {},
  refreshAuthState: () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const refreshAuthState = () => {
    try {
      if (typeof window !== 'undefined') {
        console.log("AuthProvider: מרענן מצב אימות")
        const storedIsAdmin = localStorage.getItem('isAdmin') === 'true'
        const storedToken = localStorage.getItem('adminToken')
        
        console.log(`AuthProvider: isAdmin=${storedIsAdmin}, token=${!!storedToken}`)
        
        if (storedIsAdmin && storedToken) {
          setIsAdmin(true)
          setAdminToken(storedToken)
        } else {
          setIsAdmin(false)
          setAdminToken(null)
        }
      }
    } catch (error) {
      console.error("Auth refresh error:", error)
    }
  }
  
  useEffect(() => {
    const checkAuthState = () => {
      try {
        if (typeof window !== 'undefined') {
          console.log("AuthProvider: בודק מצב אימות בעת טעינה")
          const storedIsAdmin = localStorage.getItem('isAdmin') === 'true'
          const storedToken = localStorage.getItem('adminToken')
          
          console.log(`AuthProvider: isAdmin=${storedIsAdmin}, token=${!!storedToken}`)
          
          if (storedIsAdmin && storedToken) {
            const isValidTokenFormat = storedToken.startsWith('admin-') || storedToken.length > 30
            
            if (isValidTokenFormat) {
              setIsAdmin(true)
              setAdminToken(storedToken)
            } else {
              console.log("AuthProvider: מוחק טוקן לא תקין")
              localStorage.removeItem('isAdmin')
              localStorage.removeItem('adminToken')
              setIsAdmin(false)
              setAdminToken(null)
            }
          } else {
            setIsAdmin(false)
            setAdminToken(null)
          }
          
          setIsInitialized(true)
        }
      } catch (error) {
        console.error("Auth state check error:", error)
        setIsAdmin(false)
        setAdminToken(null)
        setIsInitialized(true)
      }
    }
    
    checkAuthState()
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'isAdmin' || event.key === 'adminToken') {
        refreshAuthState()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])
  
  const login = async (password: string): Promise<boolean> => {
    try {
      console.log("AuthProvider: מנסה להתחבר")
      
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('סיסמה שגויה, אנא נסה שוב')
        } else {
          toast.error(data.error || 'שגיאה בהתחברות')
        }
        return false
      }
      
      if (data.success) {
        console.log("AuthProvider: התחברות הצליחה")
        
        localStorage.removeItem('isAdmin')
        localStorage.removeItem('adminToken')
        
        localStorage.setItem('isAdmin', 'true')
        localStorage.setItem('adminToken', data.token)
        
        setIsAdmin(true)
        setAdminToken(data.token)
        
        toast.success('התחברת בהצלחה כמנהל')
        return true
      } else {
        toast.error(data.error || 'שגיאה לא ידועה בהתחברות')
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('שגיאה בהתחברות: סיסמה שגויה')
      return false
    }
  }
  
  const logout = () => {
    console.log("AuthProvider: מתנתק")
    setIsAdmin(false)
    setAdminToken(null)
    
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('adminToken')
    
    toast.info('התנתקת בהצלחה')
  }
  
  return (
    <AuthContext.Provider value={{ isAdmin, adminToken, login, logout, refreshAuthState }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 