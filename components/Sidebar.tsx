"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Trophy, Users, Table as TableIcon, BarChart, Plus, Star, Calendar, Clock, Medal, Menu, HelpCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import { getImageUrl } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface Tournament {
  id: string
  name: string
  status: string
}

interface Match {
  id: string
  player1: { name: string }
  player2: { name: string }
  date: string
  status: string
}

interface Player {
  id: string
  name: string
  rating: number
  avatar?: string
  initials?: string
  level: number
}

interface Stats {
  totalTournaments: number
  activeTournaments: number
  totalPlayers: number
  totalMatches: number
  completedMatches?: number
  averageScore?: number
  recentMatches: any[]
  mostActivePlayer: { name: string, matches: number }
  highestRating: number
}

export function Sidebar() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [stats, setStats] = useState<Stats>({
    totalTournaments: 0,
    activeTournaments: 0,
    totalPlayers: 0,
    totalMatches: 0,
    recentMatches: [],
    mostActivePlayer: { name: '', matches: 0 },
    highestRating: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // בדיקה אם מדובר בתצוגת מובייל
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsOpen(!mobile); // Auto close on mobile, open on desktop
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    // טעינת הנתונים
    const fetchData = async () => {
      try {
        setLoading(true);
        // טעינת נתונים סטטיסטיים
        const statsResponse = await fetch('/api/stats')
        const statsData = await statsResponse.json()
        setStats(statsData)
        
        // טעינת טורנירים
        const tournamentsResponse = await fetch('/api/tournaments?limit=5')
        const tournamentsData = await tournamentsResponse.json()
        
        // טעינת שחקנים
        const playersResponse = await fetch('/api/players')
        const playersData = await playersResponse.json()
        
        // סינון טורנירים פעילים
        const activeTournaments = tournamentsData.tournaments
          ? tournamentsData.tournaments.filter((t: Tournament) => t.status === 'active').slice(0, 5)
          : []
        
        setTournaments(activeTournaments)
        
        // סינון השחקנים המובילים לפי דירוג
        const topPlayers = playersData
          ? [...playersData].sort((a: Player, b: Player) => b.rating - a.rating).slice(0, 5)
          : []
          
        setPlayers(topPlayers)
      } catch (err) {
        console.error('Error fetching sidebar data:', err)
        setError('שגיאה בטעינת הנתונים')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  // טוען את תוכן הסייד-בר - אותו תוכן ישמש גם ל-mobile וגם ל-desktop
  const SidebarContent = () => (
    <ScrollArea className="h-full">
      <div className="space-y-4 py-4">
        <div className="px-4 space-y-2">
          <h2 className="text-lg font-semibold tracking-tight mb-2">סטטיסטיקות מהירות</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col p-3 bg-blue-50 rounded-lg">
              <div className="text-xs font-medium text-muted-foreground mb-1">טורנירים פעילים</div>
              <div className="text-2xl font-bold text-blue-700">{stats.activeTournaments}</div>
            </div>
            <div className="flex flex-col p-3 bg-green-50 rounded-lg">
              <div className="text-xs font-medium text-muted-foreground mb-1">סה״כ שחקנים</div>
              <div className="text-2xl font-bold text-green-700">{stats.totalPlayers}</div>
            </div>
            <div className="flex flex-col p-3 bg-purple-50 rounded-lg">
              <div className="text-xs font-medium text-muted-foreground mb-1">סה״כ משחקים</div>
              <div className="text-2xl font-bold text-purple-700">{stats.totalMatches}</div>
            </div>
            <div className="flex flex-col p-3 bg-amber-50 rounded-lg">
              <div className="text-xs font-medium text-muted-foreground mb-1">דירוג שיא</div>
              <div className="text-2xl font-bold text-amber-700">{stats.highestRating}</div>
            </div>
          </div>
        </div>
  
        {/* ... keep rest of sidebar content the same ... */}
        
        {/* טורנירים פעילים */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold tracking-tight">טורנירים פעילים</h2>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {stats.activeTournaments}
            </Badge>
          </div>
          {tournaments.length > 0 ? (
            <div className="space-y-1">
              {tournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  href={`/tournaments/${tournament.id}`}
                  className="flex items-center rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <Trophy className="h-4 w-4 ml-2" />
                  <span className="truncate">{tournament.name}</span>
                </Link>
              ))}
            </div>
          ) : loading ? (
            <div className="flex justify-center py-2">
              <div className="animate-pulse h-6 w-32 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-2">אין טורנירים פעילים כרגע</div>
          )}
          <div className="mt-2">
            <Link href="/tournaments">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Plus className="h-4 w-4 ml-2" />
                הצג את כל הטורנירים
              </Button>
            </Link>
          </div>
        </div>
  
        {/* שחקנים מובילים */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold tracking-tight">שחקנים מובילים</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Top 5
            </Badge>
          </div>
          {players.length > 0 ? (
            <div className="space-y-2">
              {players.map((player, index) => (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 ml-2">
                      {player.avatar ? (
                        <AvatarImage src={getImageUrl(player.avatar)} alt={player.name} />
                      ) : (
                        <AvatarFallback>{player.initials || player.name.charAt(0)}</AvatarFallback>
                      )}
                    </Avatar>
                    <span className="truncate">{player.name}</span>
                  </div>
                  <Badge variant="outline" className={`${index === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-50 text-blue-700'}`}>
                    {player.rating}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : loading ? (
            <div className="flex flex-col space-y-2 py-2">
              <div className="animate-pulse h-6 w-full bg-gray-200 rounded"></div>
              <div className="animate-pulse h-6 w-full bg-gray-200 rounded"></div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-2">אין נתוני שחקנים זמינים</div>
          )}
          <div className="mt-2">
            <Link href="/players">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Plus className="h-4 w-4 ml-2" />
                הצג את כל השחקנים
              </Button>
            </Link>
          </div>
        </div>
        
        {/* כפתורים מהירים */}
        <div className="px-4 py-2">
          <h2 className="text-lg font-semibold tracking-tight mb-2">כלים מהירים</h2>
          <div className="grid gap-2">
            <Link href="/tournaments/new">
              <Button variant="outline" className="w-full justify-start">
                <Trophy className="h-4 w-4 ml-2" />
                צור טורניר חדש
              </Button>
            </Link>
            <Link href="/stats">
              <Button variant="outline" className="w-full justify-start">
                <BarChart className="h-4 w-4 ml-2" />
                צפה בסטטיסטיקות
              </Button>
            </Link>
            <Link href="/rules">
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 ml-2" />
                חוקי הטורניר
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </ScrollArea>
  )

  // בתצוגת דסקטופ - הסייד-בר תמיד מוצג
  if (!isMobile) {
    return (
      <div className="hidden lg:block fixed top-16 right-0 bottom-0 z-20 w-64 border-l bg-white shadow-sm">
        <SidebarContent />
      </div>
    )
  }

  // בתצוגת מובייל - שימוש ב-Sheet מספריית UI שמופעל על ידי כפתור
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-md z-50 bg-primary text-primary-foreground"
        >
          <Menu />
          <span className="sr-only">פתח תפריט</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-96 p-0 border-l">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  )
} 