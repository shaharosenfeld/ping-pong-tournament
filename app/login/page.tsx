"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '../hooks/use-auth'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showError, setShowError] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { login } = useAuth()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isAuthenticating) return
    
    setIsAuthenticating(true)
    setIsLoading(true)
    setError("")
    setShowError(false)
    
    try {
      // הוספת בדיקות אבטחה נוספות
      if (!password || password.length < 4) {
        setError("סיסמה חייבת להכיל לפחות 4 תווים")
        setShowError(true)
        setIsAuthenticating(false)
        setIsLoading(false)
        return
      }
      
      // הגבלת ניסיונות כניסה כושלים
      const loginAttempts = parseInt(localStorage.getItem("loginAttempts") || "0")
      
      if (loginAttempts >= 5) {
        const lastAttemptTime = parseInt(localStorage.getItem("lastLoginAttempt") || "0")
        const currentTime = Date.now()
        const timeDiff = currentTime - lastAttemptTime
        
        // אם עברו פחות מ-15 דקות מהניסיון האחרון, לא לאפשר כניסה
        if (timeDiff < 15 * 60 * 1000) {
          const minutesLeft = Math.ceil((15 * 60 * 1000 - timeDiff) / (60 * 1000))
          setError(`יותר מדי ניסיונות כניסה כושלים. נסה שוב בעוד ${minutesLeft} דקות.`)
          setShowError(true)
          setIsAuthenticating(false)
          setIsLoading(false)
          return
        }
        
        // איפוס ספירת הניסיונות אם עברו יותר מ-15 דקות
        localStorage.setItem("loginAttempts", "0")
      }
      
      // ניסיון התחברות
      console.log('Login: נשלחת בקשת התחברות עם סיסמה');
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      console.log('Login: התקבלה תגובה מהשרת:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'שגיאה לא ידועה בהתחברות');
      }
      
      if (data.success) {
        console.log("Login: התחברות הצליחה, נשמר טוקן:", data.token);
        
        // נקה את כל ערכי האימות הישנים לפני הוספת החדשים
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAuthenticated');
        
        // הוסף את ערכי האימות החדשים
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminToken', data.token);
        
        // וידוא שה-localStorage מכיל את המידע הנכון
        console.log('Login: ערכי localStorage לאחר התחברות:');
        console.log('  isAdmin:', localStorage.getItem('isAdmin'));
        console.log('  adminToken:', localStorage.getItem('adminToken'));
        
        toast({
          title: "התחברת בהצלחה",
          description: "ברוכים הבאים למערכת ניהול טורניר הפינג פונג!",
        })
        
        // הוספת השהייה קטנה כדי לוודא שה-localStorage מתעדכן לפני ההפניה
        setTimeout(() => {
          // הפניה לדף החזרה או דף ברירת המחדל
          const returnTo = searchParams.get('returnTo')
          if (returnTo) {
            window.location.href = returnTo; // השתמש ב-window.location במקום router לטעינה מחדש
          } else {
            window.location.href = '/admin'; // השתמש ב-window.location במקום router לטעינה מחדש
          }
          
          // רק אחרי שההפניה בוצעה, מסירים את מצב הטעינה
          setIsLoading(false)
          setIsAuthenticating(false)
        }, 1000)
      } else {
        // עדכון ספירת ניסיונות הכניסה
        const newAttempts = loginAttempts + 1
        localStorage.setItem("loginAttempts", newAttempts.toString())
        localStorage.setItem("lastLoginAttempt", Date.now().toString())
        
        setError("הסיסמה שגויה, אנא נסה שוב")
        setShowError(true)
        setIsLoading(false)
        setIsAuthenticating(false)
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("אירעה שגיאה בתהליך ההתחברות")
      setShowError(true)
      setIsLoading(false)
      setIsAuthenticating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <AnimatePresence>
        <motion.div
          initial={false}
          animate={showError ? {
            x: [-10, 10, -10, 10, -5, 5, -2, 2, 0],
            transition: { duration: 0.5 }
          } : {}}
        >
          <Card className={`w-[350px] border-2 ${showError ? 'border-red-500 shadow-red-100' : 'border-blue-200'} shadow-lg transition-colors duration-300`}>
            <CardHeader className={`${showError ? 'bg-gradient-to-r from-red-100 to-red-50' : 'bg-gradient-to-r from-blue-100 to-blue-50'} transition-colors duration-300`}>
              <CardTitle className={`${showError ? 'text-red-800' : 'text-blue-800'} transition-colors duration-300`}>התחברות למערכת</CardTitle>
              <CardDescription className={`${showError ? 'text-red-600' : 'text-blue-600'} transition-colors duration-300`}>
                הזן את הסיסמה כדי להתחבר למערכת ניהול התחרויות
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit} dir="rtl">
              <CardContent>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="password" className={`${showError ? 'text-red-700' : 'text-blue-700'} transition-colors duration-300`}>סיסמה</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="הזן סיסמה"
                      required
                      className={`${showError ? 'border-red-200 focus:border-red-400' : 'border-blue-200 focus:border-blue-400'} transition-colors duration-300`}
                      autoComplete="current-password"
                    />
                    {error && (
                      <div className="text-red-600 text-sm mt-2 font-medium bg-red-50 p-2 rounded border border-red-200">
                        <AlertTriangle className="h-4 w-4 inline mr-1 mb-1" />
                        {error}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className={`w-full ${showError ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} transition-colors duration-300`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>מתחבר...</span>
                    </div>
                  ) : (
                    'התחבר'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

