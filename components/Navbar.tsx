"use client"

import Link from "next/link"
import { Trophy, Users, Table as TableIcon, BarChart, Home, Settings, Bell, HelpCircle, LogIn, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { useAuth } from "@/app/hooks/use-auth"

type Notification = {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

export function Navbar() {
  const { isAdmin, logout } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Scroll handler for navbar styling
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    // Set up scroll event listener
    window.addEventListener("scroll", handleScroll)
    
    // Fetch notifications only when needed - improves performance
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // הוסף timeout לבקשה כדי למנוע המתנה ארוכה מדי
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/notifications', {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`Server responded with status: ${response.status}`);
          setError('אירעה שגיאה בטעינת ההתראות');
          setNotifications([]);
          setUnreadCount(0);
          return;
        }
        
        const data = await response.json();
        setNotifications(data);
        
        // Update unread count
        const unread = data.filter((notif: Notification) => !notif.read).length;
        setUnreadCount(unread);
      } catch (e) {
        console.error('Error fetching notifications:', e);
        
        // טיפול בשגיאות ספציפיות
        if (e instanceof DOMException && e.name === 'AbortError') {
          setError('בקשת ההתראות נכשלה עקב timeout');
        } else {
          setError('אירעה שגיאה בטעינת ההתראות');
        }
        
        // שמירה על מידע קיים במקרה של שגיאה
        if (notifications.length === 0) {
          setNotifications([]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch notifications
    fetchNotifications()
    
    // Set up auto-refresh for notifications every minute
    const intervalId = setInterval(fetchNotifications, 60000)
    
    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearInterval(intervalId)
    }
  }, [])

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ read: true }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error marking notification as read:', response.status, errorData);
        return;
      }
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
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

  return (
    <nav className="bg-white shadow-md border-b border-blue-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Main Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2 text-blue-700">
                <Home className="h-5 w-5" />
                <span>דף הבית</span>
              </Button>
            </Link>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/tournaments">
                <Button variant="ghost" className="flex items-center gap-2 text-blue-700">
                  <Trophy className="h-5 w-5" />
                  <span>תחרויות</span>
                  <Badge variant="secondary" className="mr-2 bg-blue-100">
                    חדש
                  </Badge>
                </Button>
              </Link>
              
              <Link href="/matches">
                <Button variant="ghost" className="flex items-center gap-2 text-green-700">
                  <TableIcon className="h-5 w-5" />
                  <span>משחקים</span>
                </Button>
              </Link>
              
              <Link href="/players">
                <Button variant="ghost" className="flex items-center gap-2 text-purple-700">
                  <Users className="h-5 w-5" />
                  <span>שחקנים</span>
                </Button>
              </Link>
              
              <Link href="/stats">
                <Button variant="ghost" className="flex items-center gap-2 text-amber-700">
                  <BarChart className="h-5 w-5" />
                  <span>סטטיסטיקות</span>
                </Button>
              </Link>
              
              <Link href="/rules">
                <Button variant="ghost" className="flex items-center gap-2 text-indigo-700">
                  <HelpCircle className="h-5 w-5" />
                  <span>חוקים ודירוג</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-4">
            {/* התראות מוצגות רק למנהלים */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-blue-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {loading ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">טוען התראות...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">אין התראות חדשות</div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem key={notification.id} onClick={() => markAsRead(notification.id)}>
                        <div className="flex flex-col w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{notification.title}</span>
                            <Badge variant={notification.read ? "outline" : "default"} className="text-xs">
                              {formatTimeAgo(notification.createdAt)}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">{notification.message}</span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                  {notifications.length > 0 && (
                    <Link href="/admin" className="block w-full text-center text-sm p-2 border-t border-border hover:bg-accent">
                      צפה בכל ההתראות
                    </Link>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* כפתור לוח הבקרה - מוצג רק למנהלים */}
            {isAdmin ? (
              <>
                <Link href="/admin">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <span className="hidden md:inline">לוח בקרה</span>
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="hidden md:flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
                  onClick={() => {
                    logout();
                    window.location.href = '/';
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>התנתק</span>
                </Button>
              </>
            ) : (
              <Link href="/login" className="hidden md:block">
                <Button variant="outline" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200">
                  <LogIn className="h-4 w-4" />
                  <span>התחבר כמנהל</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <span className="sr-only">פתח תפריט</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Link href="/tournaments" className="flex items-center gap-2 w-full">
                    <Trophy className="h-4 w-4" />
                    <span>תחרויות</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/matches" className="flex items-center gap-2 w-full">
                    <TableIcon className="h-4 w-4" />
                    <span>משחקים</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/players" className="flex items-center gap-2 w-full">
                    <Users className="h-4 w-4" />
                    <span>שחקנים</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/stats" className="flex items-center gap-2 w-full">
                    <BarChart className="h-4 w-4" />
                    <span>סטטיסטיקות</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/rules" className="flex items-center gap-2 w-full">
                    <HelpCircle className="h-4 w-4" />
                    <span>חוקים ודירוג</span>
                  </Link>
                </DropdownMenuItem>
                
                {/* כפתורי מנהל/התחברות בתפריט המובייל */}
                {isAdmin ? (
                  <>
                    <DropdownMenuItem>
                      <Link href="/admin" className="flex items-center gap-2 w-full">
                        <Settings className="h-4 w-4" />
                        <span>לוח בקרה</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <button 
                        className="flex items-center gap-2 w-full text-red-600"
                        onClick={() => {
                          logout();
                          window.location.href = '/';
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>התנתק</span>
                      </button>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem>
                    <Link href="/login" className="flex items-center gap-2 w-full text-blue-600">
                      <LogIn className="h-4 w-4" />
                      <span>התחבר כמנהל</span>
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
} 