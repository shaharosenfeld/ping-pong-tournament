"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, RefreshCcw, LogOut, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import AdminCheck from "@/components/admin-check"

export default function AdminSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isClearing, setIsClearing] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // פונקציה לניקוי נתוני אימות המנהל
  const clearAuthData = () => {
    setIsClearing(true)
    try {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('isAdmin')
      localStorage.removeItem('isAuthenticated')
      
      toast({
        title: "נתונים נוקו בהצלחה",
        description: "נתוני האימות נמחקו. נא להתחבר מחדש.",
        variant: "default",
      })
      
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (error) {
      console.error('Error clearing auth data:', error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בניקוי הנתונים",
        variant: "destructive",
      })
      setIsClearing(false)
    }
  }

  // פונקציה להתנתקות והפניה לדף הכניסה
  const handleLogout = () => {
    setIsLoggingOut(true)
    try {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('isAdmin')
      localStorage.removeItem('isAuthenticated')
      
      toast({
        title: "התנתקת בהצלחה",
        description: "מתנתק מהמערכת...",
        variant: "default",
      })
      
      setTimeout(() => {
        router.push('/login')
      }, 1000)
    } catch (error) {
      console.error('Error logging out:', error)
      setIsLoggingOut(false)
      
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהתנתקות",
        variant: "destructive",
      })
    }
  }

  return (
    <AdminCheck>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">הגדרות מנהל</h1>
        
        <Tabs defaultValue="auth">
          <TabsList className="mb-4">
            <TabsTrigger value="auth">הרשאות ואימות</TabsTrigger>
            <TabsTrigger value="system">מערכת</TabsTrigger>
          </TabsList>
          
          <TabsContent value="auth">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-500" />
                    ניהול הרשאות
                  </CardTitle>
                  <CardDescription>
                    ניהול הרשאות וטוקנים שמאפשרים גישה למערכת
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    במקרה של בעיות בכניסה או בביצוע פעולות ניהול, ניתן לנקות את נתוני האימות ולהתחבר מחדש.
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
                    {isLoggingOut ? (
                      <>
                        <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                        מתנתק...
                      </>
                    ) : (
                      <>
                        <LogOut className="h-4 w-4 mr-2" />
                        התנתק
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={clearAuthData}
                    disabled={isClearing}
                  >
                    {isClearing ? (
                      <>
                        <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                        מנקה נתונים...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        נקה נתוני אימות
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>פרטי חיבור</CardTitle>
                  <CardDescription>
                    מידע על חיבור נוכחי ואימות
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">סטטוס מנהל: </span>
                    <span className={`${localStorage.getItem('isAdmin') === 'true' ? 'text-green-600' : 'text-red-600'}`}>
                      {localStorage.getItem('isAdmin') === 'true' ? 'מחובר כמנהל' : 'לא מחובר כמנהל'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">טוקן: </span>
                    <span className={`${localStorage.getItem('adminToken') ? 'text-green-600' : 'text-red-600'}`}>
                      {localStorage.getItem('adminToken') ? 'קיים' : 'לא קיים'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>הגדרות מערכת</CardTitle>
                <CardDescription>
                  הגדרות מתקדמות למערכת
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  הגדרות מערכת מתקדמות יתווספו בעתיד.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminCheck>
  )
} 