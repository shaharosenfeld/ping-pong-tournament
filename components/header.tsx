"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trophy, Users, BarChart2, Bell, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/app/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  const { isAdmin, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  
  // Fetch unread notification count
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const data = await response.json()
          const unreadCount = data.notifications.filter((n: any) => !n.read).length
          setNotificationCount(unreadCount)
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }
    
    fetchNotifications()
    
    // Set up polling for notifications
    const interval = setInterval(fetchNotifications, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [])
  
  const navItems = [
    { href: '/', label: 'ראשי', icon: <Trophy className="h-4 w-4" /> },
    { href: '/tournaments', label: 'טורנירים', icon: <Trophy className="h-4 w-4" /> },
    { href: '/matches', label: 'משחקים', icon: <Trophy className="h-4 w-4" /> },
    { href: '/players', label: 'שחקנים', icon: <Users className="h-4 w-4" /> },
    { href: '/stats', label: 'סטטיסטיקות', icon: <BarChart2 className="h-4 w-4" /> },
  ]
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl hidden sm:inline-block">טורניר פינג פונג</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center gap-4">
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                  {notificationCount}
                </Badge>
              )}
            </Button>
          </Link>
          
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                מנהל
              </Badge>
              <Button variant="ghost" size="sm" onClick={logout}>
                התנתק
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">
                כניסת מנהל
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t p-4 bg-background">
          <nav className="grid gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium p-2 rounded-md transition-colors",
                  pathname === item.href 
                    ? "bg-muted text-primary" 
                    : "hover:bg-muted hover:text-primary"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
} 