"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  Users,
  Table as TableTennis,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Settings,
  BarChart,
  Bell,
  Check,
  Calendar,
  Activity,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Overview } from "@/components/Overview"
import { RecentActivities } from "@/components/RecentActivities"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "../hooks/use-auth"

interface Match {
  id: string
  player1: { name: string }
  player2: { name: string }
  tournament: { name: string }
  date: string
  player1Score?: number
  player2Score?: number
  status: string
}

interface Stats {
  totalPlayers: number
  totalTournaments: number
  totalMatches: number
  activeTournaments: number
  formatStats: {
    knockout: number
    league: number
    groups: number
  }
  recentActivities: Match[]
  upcomingMatches: Match[]
}

async function getAdminStats(): Promise<Stats> {
  const res = await fetch(`/api/admin/stats`, {
    cache: 'no-store'
  })
  if (!res.ok) {
    throw new Error('Failed to load admin stats')
  }
  return res.json()
}

export default function AdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAdmin, logout } = useAuth()
  const [adminName, setAdminName] = useState("")
  const [adminStats, setAdminStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState<Array<{
    id: string | number;
    text: string;
    time: string;
    read: boolean;
  }>>([])
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    tournamentUpdates: true,
    matchUpdates: true,
    playerUpdates: true,
  })
  const [systemSettings, setSystemSettings] = useState({
    siteName: "טורניר פינג פונג",
    logoUrl: "",
    primaryColor: "#2563eb",
    language: "he",
    welcomeMessage: "ברוכים הבאים למערכת ניהול טורניר פינג פונג!",
  })
  const [openDialogs, setOpenDialogs] = useState({
    dataCleanup: false,
    systemSettings: false,
    addUser: false,
    editUser: false,
    deleteUser: false,
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState<"dataCleanup" | "deleteUser" | null>(null)
  
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const data = await getAdminStats()
        setAdminStats(data)
        
        try {
          const notificationsResponse = await fetch('/api/notifications')
          if (notificationsResponse.ok) {
            const notificationsData = await notificationsResponse.json()
            const formattedNotifications = notificationsData.map((notification: any) => ({
              id: notification.id,
              text: notification.message,
              time: formatTimeAgo(new Date(notification.createdAt)),
              read: notification.read
            }))
            setNotifications(formattedNotifications)
          }
        } catch (notificationError) {
          console.error('Error loading notifications:', notificationError)
          toast({
            title: "התראות",
            description: "לא ניתן לטעון התראות",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error loading admin stats:', error)
        toast({
          title: "שגיאה",
          description: "שגיאה בטעינת נתוני המערכת",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    function formatTimeAgo(date: Date): string {
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffSecs = Math.floor(diffMs / 1000)
      const diffMins = Math.floor(diffSecs / 60)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)
      
      if (diffDays > 0) {
        return diffDays === 1 ? 'לפני יום' : `לפני ${diffDays} ימים`
      } else if (diffHours > 0) {
        return diffHours === 1 ? 'לפני שעה' : `לפני ${diffHours} שעות`
      } else if (diffMins > 0) {
        return diffMins === 1 ? 'לפני דקה' : `לפני ${diffMins} דקות`
      } else {
        return 'זה עתה'
      }
    }

    const adminStatus = localStorage.getItem("isAdmin")
    const name = localStorage.getItem("adminName")

    if (adminStatus === "true" && name) {
      setAdminName(name)
      loadAdminData()
    } else {
      router.push("/login")
    }
  }, [router, toast, isAdmin])

  const handleLogout = () => {
    logout();
    router.push("/");
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
      })
      
      if (!response.ok) {
        throw new Error('Failed to mark notifications as read')
      }
      
      // עדכון המצב המקומי
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      
      toast({
        title: "התראות",
        description: "כל ההתראות סומנו כנקראו",
      })
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      toast({
        title: "שגיאה",
        description: "שגיאה בסימון התראות כנקראו",
        variant: "destructive",
      })
    }
  }

  const handleNotificationSettingsChange = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }))
    toast({
      title: "הגדרות התראות",
      description: "ההגדרות עודכנו בהצלחה",
    })
  }

  const handleSystemSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSystemSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(systemSettings),
      })

      if (!response.ok) throw new Error('Failed to save settings')

      toast({
        title: "הגדרות מערכת",
        description: "ההגדרות נשמרו בהצלחה",
      })
      handleCloseDialog("systemSettings")
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "שגיאה",
        description: "שגיאה בשמירת ההגדרות",
        variant: "destructive",
      })
    }
  }

  const handleConfirmPassword = () => {
    if (confirmPassword === "8891") {
      if (pendingAction === "dataCleanup") {
        handleDataCleanup()
      } else if (pendingAction === "deleteUser") {
        handleDeleteUser("1")
      }
      setShowPasswordConfirm(false)
      setConfirmPassword("")
      setPendingAction(null)
    } else {
      toast({
        title: "שגיאה",
        description: "סיסמה שגויה",
        variant: "destructive",
      })
    }
  }

  const handleDataCleanup = async () => {
    const dialogResult = await new Promise<string | null>((resolve) => {
      const backdrop = document.createElement('div')
      backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 z-40'
      document.body.appendChild(backdrop)
      
      const dialog = document.createElement('dialog')
      dialog.className = 'fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 border-2 border-blue-200 min-w-[300px] z-50'
      
      const style = document.createElement('style')
      style.textContent = `
        dialog::backdrop {
          background-color: rgba(0, 0, 0, 0.5);
        }
        dialog {
          position: fixed;
          margin: 0;
          padding: 1.5rem;
          border: none;
          border-radius: 0.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `
      document.head.appendChild(style)
      
      dialog.innerHTML = `
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-blue-800">אישור מחיקת נתונים</h3>
          <p class="text-sm text-gray-600">הזן סיסמה למחיקת כל הנתונים</p>
          <div class="relative">
            <input type="password" id="cleanup-password" 
              class="w-full p-2 pr-10 border-2 border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              placeholder="הזן סיסמה"
              autofocus
            />
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button id="cancel-cleanup" class="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
              ביטול
            </button>
            <button id="confirm-cleanup" class="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
              אישור
            </button>
          </div>
          <p id="error-message" class="text-red-500 text-sm text-center mt-2 hidden">סיסמה שגויה</p>
        </div>
      `
      
      document.body.appendChild(dialog)
      dialog.showModal()

      const passwordInput = dialog.querySelector('#cleanup-password') as HTMLInputElement
      const confirmButton = dialog.querySelector('#confirm-cleanup') as HTMLButtonElement
      const errorMessage = dialog.querySelector('#error-message') as HTMLParagraphElement
      
      setTimeout(() => {
        passwordInput?.focus()
      }, 100)
      
      const showError = () => {
        errorMessage.classList.remove('hidden')
        passwordInput.classList.add('border-red-500')
        passwordInput.classList.add('focus:ring-red-500')
      }
      
      const hideError = () => {
        errorMessage.classList.add('hidden')
        passwordInput.classList.remove('border-red-500')
        passwordInput.classList.remove('focus:ring-red-500')
      }
      
      const handleSubmit = async () => {
        const password = passwordInput.value
        
        try {
          const response = await fetch('/api/admin/cleanup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password })
          })

          if (!response.ok) {
            if (response.status === 401) {
              showError()
              return
            }
            throw new Error('Failed to cleanup data')
          }

          const data = await response.json()
          resolve(password)
          dialog.close()
          
          toast({
            title: "ניקוי נתונים",
            description: `הנתונים נוקו בהצלחה. נמחקו: ${data.stats.deletedMatches} משחקים, ${data.stats.deletedTournaments} טורנירים, ${data.stats.deletedPlayers} שחקנים`,
          })
          
          window.location.reload()
        } catch (error) {
          console.error('Error during cleanup:', error)
          toast({
            title: "שגיאה",
            description: "שגיאה בניקוי הנתונים",
            variant: "destructive",
          })
        }
      }

      passwordInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleSubmit()
        }
      })
      
      passwordInput?.addEventListener('input', hideError)

      dialog.querySelector('#cancel-cleanup')?.addEventListener('click', () => {
        dialog.close()
        resolve(null)
      })

      confirmButton?.addEventListener('click', handleSubmit)

      dialog.addEventListener('close', () => {
        document.body.removeChild(dialog)
        document.body.removeChild(backdrop)
        resolve(null)
      })
    })

    if (!dialogResult) {
      return
    }
  }

  const handleAddUser = async () => {
    try {
      const usernameInput = document.getElementById('username') as HTMLInputElement
      const passwordInput = document.getElementById('password') as HTMLInputElement
      const roleInput = document.getElementById('role') as HTMLSelectElement

      if (!usernameInput || !passwordInput || !roleInput) {
        throw new Error('Missing form fields')
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: usernameInput.value,
          email: `${usernameInput.value}@example.com`,
          password: passwordInput.value,
          role: roleInput.value,
        }),
      })

      if (!response.ok) throw new Error('Failed to add user')

      toast({
        title: "הוספת משתמש",
        description: "המשתמש נוסף בהצלחה",
      })
      handleCloseDialog("addUser")
    } catch (error) {
      console.error('Error adding user:', error)
      toast({
        title: "שגיאה",
        description: "שגיאה בהוספת המשתמש",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = async (userId: string) => {
    try {
      const usernameInput = document.getElementById('edit-username') as HTMLInputElement
      const passwordInput = document.getElementById('edit-password') as HTMLInputElement
      const roleInput = document.getElementById('edit-role') as HTMLSelectElement

      if (!usernameInput || !passwordInput || !roleInput) {
        throw new Error('Missing form fields')
      }

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          name: usernameInput.value,
          email: `${usernameInput.value}@example.com`,
          password: passwordInput.value,
          role: roleInput.value,
        }),
      })

      if (!response.ok) throw new Error('Failed to update user')

      toast({
        title: "עריכת משתמש",
        description: "המשתמש עודכן בהצלחה",
      })
      handleCloseDialog("editUser")
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון המשתמש",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete user')

      toast({
        title: "מחיקת משתמש",
        description: "המשתמש נמחק בהצלחה",
      })
      handleCloseDialog("deleteUser")
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת המשתמש",
        variant: "destructive",
      })
    }
  }

  const handleCloseDialog = (dialogName: keyof typeof openDialogs) => {
    setOpenDialogs(prev => ({
      ...prev,
      [dialogName]: false
    }))
  }

  const handleRecalculatePlayerLevels = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/players/recalculate-levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to recalculate player levels');
      }
      
      toast({
        title: "פעולה הושלמה",
        description: "רמות השחקנים חושבו מחדש בהצלחה",
      });
      
      // Reload admin data
      const data = await getAdminStats();
      setAdminStats(data);
    } catch (error) {
      console.error('Error recalculating player levels:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בחישוב מחדש של רמות השחקנים",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculateAllPlayerStats = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/players/recalculate-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to recalculate all player stats');
      }
      
      toast({
        title: "פעולה הושלמה",
        description: "כל נתוני השחקנים חושבו מחדש בהצלחה",
      });
      
      // Reload admin data
      const data = await getAdminStats();
      setAdminStats(data);
    } catch (error) {
      console.error('Error recalculating all player stats:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בחישוב מחדש של נתוני השחקנים",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">לוח בקרה למנהל</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">שלום, {adminName}</span>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            התנתק
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">לוח בקרה</TabsTrigger>
          <TabsTrigger value="settings">הגדרות</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">שחקנים</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats?.totalPlayers ?? 0}</div>
                <p className="text-xs text-muted-foreground">סה"כ שחקנים רשומים</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">תחרויות</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats?.totalTournaments ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {adminStats?.activeTournaments ?? 0} תחרויות פעילות
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">משחקים</CardTitle>
                <TableTennis className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats?.totalMatches ?? 0}</div>
                <p className="text-xs text-muted-foreground">סה"כ משחקים</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">התראות</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {notifications.filter(n => !n.read).length}
                </div>
                <p className="text-xs text-muted-foreground">התראות חדשות</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <div className="flex items-center justify-between space-y-0">
                  <div>
                    <CardTitle>סטטיסטיקות</CardTitle>
                    <CardDescription>סטטיסטיקות מערכת</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDateRangePicker />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>

            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>פעולות ניהול</CardTitle>
                <CardDescription>פעולות תחזוקה למערכת</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div>
                    <h3 className="font-medium">חישוב מחדש של דירוג שחקנים</h3>
                      <p className="text-sm text-muted-foreground">
                        חישוב מחדש של כל דירוגי השחקנים לפי שיטת הדירוג המאוחדת
                      </p>
                  </div>
                  <Button 
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/players/recalculate-all', {
                          method: 'POST',
                        });
                        
                        if (res.ok) {
                          toast({
                            title: "הצלחה",
                            description: "דירוגי השחקנים חושבו מחדש בהצלחה",
                            variant: "default",
                          });
                        } else {
                          const error = await res.json();
                          throw new Error(error.error || 'שגיאה בחישוב מחדש של דירוגי השחקנים');
                        }
                      } catch (error: any) {
                        toast({
                          title: "שגיאה",
                          description: error.message || 'שגיאה בחישוב מחדש של דירוגי השחקנים',
                          variant: "destructive",
                        });
                      }
                    }}
                    variant="outline" 
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    חשב מחדש
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>פעילות אחרונה</CardTitle>
                <CardDescription>פעילות במערכת</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivities activities={adminStats?.recentActivities ?? []} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>התראות</CardTitle>
                <CardDescription>התראות מערכת</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      אין התראות חדשות
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <Button variant="outline" size="sm" onClick={markAllAsRead}>
                          <Check className="mr-2 h-4 w-4" />
                          סמן הכל כנקרא
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 rounded-lg ${
                              notification.read ? "bg-muted/50" : "bg-muted"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-muted-foreground" />
                                <span>{notification.text}</span>
                              </div>
                              <Badge variant={notification.read ? "outline" : "default"}>
                                {notification.time}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>הגדרות התראות</CardTitle>
                <CardDescription>הגדר את העדפות ההתראות שלך</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailNotifications">התראות במייל</Label>
                    <Switch
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={() => handleNotificationSettingsChange("emailNotifications")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pushNotifications">התראות דחיפה</Label>
                    <Switch
                      id="pushNotifications"
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={() => handleNotificationSettingsChange("pushNotifications")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tournamentUpdates">עדכוני תחרויות</Label>
                    <Switch
                      id="tournamentUpdates"
                      checked={notificationSettings.tournamentUpdates}
                      onCheckedChange={() => handleNotificationSettingsChange("tournamentUpdates")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="matchUpdates">עדכוני משחקים</Label>
                    <Switch
                      id="matchUpdates"
                      checked={notificationSettings.matchUpdates}
                      onCheckedChange={() => handleNotificationSettingsChange("matchUpdates")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="playerUpdates">עדכוני שחקנים</Label>
                    <Switch
                      id="playerUpdates"
                      checked={notificationSettings.playerUpdates}
                      onCheckedChange={() => handleNotificationSettingsChange("playerUpdates")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>פעולות מערכת</CardTitle>
              <CardDescription>פעולות מיוחדות למנהל המערכת</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">חישוב מחדש של רמות שחקנים</h4>
                      <p className="text-sm text-muted-foreground">
                        חשב מחדש את רמות כל השחקנים לפי הדירוג הנוכחי שלהם
                      </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleRecalculatePlayerLevels}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Activity className="mr-2 h-4 w-4 animate-spin" />
                        מחשב...
                      </>
                    ) : (
                      <>
                        <Activity className="mr-2 h-4 w-4" />
                        חשב מחדש
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">חישוב מחדש של כל נתוני השחקנים</h4>
                      <p className="text-sm text-muted-foreground">
                        חשב מחדש את כל נתוני השחקנים (ניצחונות, הפסדים, דירוג ורמה) בהתבסס על המשחקים הקיימים
                      </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleRecalculateAllPlayerStats}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Activity className="mr-2 h-4 w-4 animate-spin" />
                        מחשב...
                      </>
                    ) : (
                      <>
                        <BarChart className="mr-2 h-4 w-4" />
                        חשב הכל מחדש
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AdminPageSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(null).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(3).fill(null).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

