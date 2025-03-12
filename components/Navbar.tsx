"use client"

import Link from "next/link"
import { Trophy, Users, Table as TableIcon, BarChart, Home, Settings, Bell, HelpCircle, LogIn, LogOut, Menu, X } from "lucide-react"
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
    
    // Clean up on component unmount
    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearInterval(intervalId)
    }
  }, [])
  
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(prev => prev.map(notification => {
        if (notification.id === id) {
          return { ...notification, read: true };
        }
        return notification;
      }));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };
  
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return `לפני ${interval} שנים`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return `לפני ${interval} חודשים`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return `לפני ${interval} ימים`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return `לפני ${interval} שעות`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return `לפני ${interval} דקות`;
    }
    
    return 'לפני פחות מדקה';
  };

  return (
    <nav className={`bg-white sticky top-0 z-30 w-full transition-shadow ${
      isScrolled ? "shadow-md" : ""
    }`}>
      <div className="mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-primary"
                >
                  <path
                    d="M4 17L10 11L4 5M12 19H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="hidden text-lg font-semibold text-blue-700 sm:block mr-2">
                פינג פונג <span className="text-blue-500">מקצועי</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
            <div className="flex space-x-4 space-x-reverse">
              <Link href="/">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  <span>דף הבית</span>
                </Button>
              </Link>
              <Link href="/tournaments">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  <span>תחרויות</span>
                </Button>
              </Link>
              <Link href="/matches">
                <Button variant="ghost" className="flex items-center gap-2">
                  <TableIcon className="h-5 w-5" />
                  <span>משחקים</span>
                </Button>
              </Link>
              <Link href="/players">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>שחקנים</span>
                </Button>
              </Link>
              <Link href="/stats">
                <Button variant="ghost" className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  <span>סטטיסטיקות</span>
                </Button>
              </Link>
              <Link href="/rules">
                <Button variant="ghost" className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  <span>חוקים ודירוג</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 md:gap-4">
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
                <Link href="/admin" className="hidden md:block">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <span className="md:inline">לוח בקרה</span>
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

            {/* Mobile Menu Button - Only visible on mobile */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">פתח תפריט</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[75vw] max-w-sm p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold">תפריט ניווט</h2>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto py-2">
                    <div className="space-y-1 px-2">
                      <Link href="/" className="flex items-center p-2 rounded-md hover:bg-muted">
                        <Home className="h-5 w-5 ml-2 text-blue-600" />
                        <span className="text-sm font-medium">דף הבית</span>
                      </Link>
                      <Link href="/tournaments" className="flex items-center p-2 rounded-md hover:bg-muted">
                        <Trophy className="h-5 w-5 ml-2 text-yellow-600" />
                        <span className="text-sm font-medium">תחרויות</span>
                      </Link>
                      <Link href="/matches" className="flex items-center p-2 rounded-md hover:bg-muted">
                        <TableIcon className="h-5 w-5 ml-2 text-green-600" />
                        <span className="text-sm font-medium">משחקים</span>
                      </Link>
                      <Link href="/players" className="flex items-center p-2 rounded-md hover:bg-muted">
                        <Users className="h-5 w-5 ml-2 text-indigo-600" />
                        <span className="text-sm font-medium">שחקנים</span>
                      </Link>
                      <Link href="/stats" className="flex items-center p-2 rounded-md hover:bg-muted">
                        <BarChart className="h-5 w-5 ml-2 text-purple-600" />
                        <span className="text-sm font-medium">סטטיסטיקות</span>
                      </Link>
                      <Link href="/rules" className="flex items-center p-2 rounded-md hover:bg-muted">
                        <HelpCircle className="h-5 w-5 ml-2 text-teal-600" />
                        <span className="text-sm font-medium">חוקים ודירוג</span>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="border-t p-4">
                    {isAdmin ? (
                      <>
                        <div className="space-y-3">
                          <Link href="/admin" className="flex items-center p-2 rounded-md hover:bg-muted">
                            <Settings className="h-5 w-5 ml-2 text-gray-600" />
                            <span className="text-sm font-medium">לוח בקרה</span>
                          </Link>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
                            onClick={() => {
                              logout();
                              window.location.href = '/';
                            }}
                          >
                            <LogOut className="h-4 w-4 ml-2" />
                            <span>התנתק</span>
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Link href="/login">
                        <Button variant="outline" className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200">
                          <LogIn className="h-4 w-4 ml-2" />
                          <span>התחבר כמנהל</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
} 