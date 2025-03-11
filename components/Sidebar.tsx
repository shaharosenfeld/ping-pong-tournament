"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Trophy, Users, Table as TableIcon, BarChart, Plus, Star, Calendar, Clock, Medal, Menu, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import { getImageUrl } from "@/lib/utils"

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    // בדיקה אם מדובר בתצוגת מובייל
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    // טעינת הנתונים
    const fetchData = async () => {
      try {
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
        
        // הדפסת נתיבי התמונות לבדיקה מורחבת
        console.log('Detailed players data:', {
          rawPlayersData: playersData ? playersData.slice(0, 3) : [],
          topPlayersAvatars: topPlayers.map(p => ({ 
            name: p.name,
            avatarOriginal: p.avatar,
            avatarProcessed: getImageUrl(p.avatar)
          }))
        });
        
        setPlayers(topPlayers)
      } catch (e) {
        console.error('Error fetching sidebar data:', e)
        setError('אירעה שגיאה בטעינת הנתונים')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [])

  // בתצוגת מובייל, נציג כפתור המציג/מסתיר את התפריט
  if (isMobile && !isSidebarOpen) {
    return (
      <Button 
        variant="outline" 
        size="icon" 
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg bg-white" 
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="hidden lg:block w-64 bg-white border-l border-blue-100 p-4 fixed top-16 bottom-0 right-0">
      <ScrollArea className="h-full">
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 px-4 text-lg font-semibold tracking-tight text-blue-800">
              נתונים מעניינים
            </h3>
            <div className="space-y-3 px-4">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">סה"כ משחקים</span>
                <div className="flex items-center">
                  <TableIcon className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="font-medium">{stats.totalMatches}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({stats.completedMatches || 0} הושלמו)
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">אחוז השלמה</span>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-green-500 mr-2" />
                  <span className="font-medium">
                    {stats.totalMatches > 0 
                      ? Math.round(((stats.completedMatches || 0) / stats.totalMatches) * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">דירוג ממוצע</span>
                <div className="flex items-center">
                  <BarChart className="h-4 w-4 text-green-500 mr-2" />
                  <span className="font-medium">{stats.averageScore || 0}</span>
                  <span className="text-xs text-gray-500 ml-1">נק' בממוצע</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">דירוג הגבוה ביותר</span>
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="font-medium">{stats.highestRating}</span>
                </div>
              </div>
              
              {stats.mostActivePlayer?.name && (
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">השחקן הפעיל ביותר</span>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="font-medium">{stats.mostActivePlayer.name}</span>
                    <Badge variant="outline" className="mr-auto text-xs">
                      {stats.mostActivePlayer.matches} משחקים
                    </Badge>
                  </div>
                </div>
              )}
              
              {/* דירוג שחקנים מובילים */}
              {players.length > 0 && (
                <div className="pt-3 mt-3 border-t border-dashed border-blue-100">
                  <span className="text-sm font-semibold block mb-2">דירוג שחקנים מובילים</span>
                  <div className="space-y-2">
                    {players.map((player, index) => (
                      <Link key={player.id} href={`/players/${player.id}`}>
                        <div className="flex items-center gap-2 py-1 px-1 rounded-sm hover:bg-blue-50 transition-colors">
                          <div className="relative">
                            <Avatar className="h-7 w-7 border border-blue-100">
                              {player.avatar ? (
                                <div className="h-full w-full overflow-hidden rounded-full">
                                  <img 
                                    src={getImageUrl(player.avatar)} 
                                    alt={player.name} 
                                    className="h-full w-full object-cover rounded-full"
                                    onError={(e) => {
                                      console.log('Error loading player image in sidebar');
                                      const target = e.target as HTMLImageElement;
                                      const originalSrc = target.src;
                                      const newSrc = `${originalSrc}?t=${new Date().getTime()}`;
                                      console.log('Trying with cache busting:', newSrc);
                                      target.src = newSrc;
                                      
                                      target.onerror = () => {
                                        console.log('Second attempt failed, using placeholder');
                                        target.src = '/placeholder-user.jpg';
                                        target.onerror = null;
                                      };
                                    }}
                                  />
                                </div>
                              ) : (
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs rounded-full">
                                  {typeof player.initials === 'string' ? player.initials : ''}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            {player.level > 0 && (
                              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold border border-white">
                                {player.level}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 truncate text-sm">
                            {player.name}
                          </div>
                          
                          <div className="flex items-center">
                            <div className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold ${
                              index === 0 ? "bg-yellow-100 text-yellow-700" : 
                              index === 1 ? "bg-gray-100 text-gray-700" : 
                              index === 2 ? "bg-amber-100 text-amber-700" :
                              "bg-blue-50 text-blue-700"
                            }`}>
                              {index + 1}
                            </div>
                            <Badge className="ml-1 text-[10px] py-0 h-4 bg-blue-50 text-blue-700 font-medium">
                              {player.rating}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {tournaments.length > 0 && (
            <div>
              <h3 className="mb-2 px-4 text-lg font-semibold tracking-tight text-blue-800">
                תחרויות פעילות
              </h3>
              <div className="space-y-1">
                {tournaments.map(tournament => (
                  <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span>{tournament.name}</span>
                      <Badge variant="secondary" className="mr-auto">פעיל</Badge>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {matches.length > 0 && (
            <div>
              <h3 className="mb-2 px-4 text-lg font-semibold tracking-tight text-blue-800">
                משחקים קרובים
              </h3>
              <div className="space-y-1">
                {matches.map(match => (
                  <Link key={match.id} href={`/matches/${match.id}`}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <span>{match.player1.name} vs {match.player2.name}</span>
                      <Badge variant="outline" className="mr-auto">
                        {new Date(match.date).toLocaleDateString('he-IL')}
                      </Badge>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 py-4 border-t border-dashed border-blue-100">
            <Link href="/rules" className="flex justify-center">
              <Button variant="outline" size="sm" className="w-full gap-1 text-indigo-700 border-indigo-200 hover:bg-indigo-50">
                <HelpCircle className="h-3.5 w-3.5" />
                חוקי הדירוג והמשחק
              </Button>
            </Link>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
} 