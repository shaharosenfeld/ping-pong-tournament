"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Table, Users, BarChart, ArrowUpRight, Calendar, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "./hooks/use-auth"

interface RecentTournament {
  id: string
  name: string
  date: string
  status: string
  format: string
  players: number
  matches: number
  completedMatches: number
  winner: string | null
  runnerUp: string | null
}

interface Stats {
  activeTournaments: number
  upcomingMatches: number
  totalPlayers: number
  formatStats?: {
    knockout: number
    league: number
    groups: number
  }
  recentTournaments?: RecentTournament[]
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({
    activeTournaments: 0,
    upcomingMatches: 0,
    totalPlayers: 0,
  })
  const [latestTournament, setLatestTournament] = useState<RecentTournament | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [recentMatches, setRecentMatches] = useState<any[]>([])
  const { isAdmin } = useAuth()

  // הוספת פונקציה לפורמט התאריך
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', { 
      day: 'numeric', 
      month: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // שיפור משמעותי: טעינה מקבילה של נתונים
        const [statsResponse, tournamentsResponse, matchesResponse] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/tournaments'),
          fetch('/api/matches')
        ])
        
        if (!statsResponse.ok || !tournamentsResponse.ok || !matchesResponse.ok) {
          throw new Error('אחת מהבקשות נכשלה')
        }
        
        const statsData = await statsResponse.json()
        const tournamentsData = await tournamentsResponse.json()
        const matchesData = await matchesResponse.json()
        
        setStats(statsData)
        
        // עיבוד הטורניר האחרון
        if (tournamentsData.tournaments && tournamentsData.tournaments.length > 0) {
          const sortedTournaments = [...tournamentsData.tournaments].sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          
          const latest = sortedTournaments[0]
          
          setLatestTournament({
            id: latest.id,
            name: latest.name,
            date: formatDate(latest.startDate),
            format: latest.format,
            status: latest.status,
            matches: latest.matches.length,
            players: latest.players.length,
            completedMatches: latest.matches.filter((m: any) => m.status === 'completed').length,
            winner: null,
            runnerUp: null
          })
        }
        
        // עיבוד הנתונים למשחקים אחרונים
        if (matchesData.matches && matchesData.matches.length > 0) {
          const recentMatches = [...matchesData.matches]
            .filter(match => match.status === 'completed')
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5)
            .map(match => ({
              id: match.id,
              tournamentId: match.tournamentId,
              player1: {
                id: match.player1.id,
                name: match.player1.name,
                rating: match.player1.rating
              },
              player2: {
                id: match.player2.id,
                name: match.player2.name,
                rating: match.player2.rating
              },
              score: `${match.player1Score}-${match.player2Score}`,
              date: formatDate(match.date || match.updatedAt)
            }))
          
          setRecentMatches(recentMatches)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "שגיאה בטעינת נתונים",
          description: "אירעה שגיאה בטעינת הנתונים מהשרת",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Function to get format label
  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'knockout':
        return 'נוקאאוט'
      case 'league':
        return 'ליגה'
      case 'groups':
        return 'קבוצות'
      default:
        return format
    }
  }

  // Function to get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'טיוטה'
      case 'active':
        return 'פעיל'
      case 'completed':
        return 'הושלם'
      case 'cancelled':
        return 'בוטל'
      default:
        return status
    }
  }

  // Function to get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "outline" => {
    switch (status) {
      case 'active':
        return 'default'
      case 'completed':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-[1400px] mx-auto">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 mb-12">
          <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              PaddleBot
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl">
              מערכת מתקדמת לניהול טורנירי פינג פונג מקצועיים. עקוב אחר התקדמות השחקנים, נהל תחרויות, וצור ליגות בקלות.
            </p>
            <div className="flex flex-wrap gap-4">
              {isAdmin && (
                <Link href="/tournaments/new">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                    צור תחרות חדשה
                    <ArrowUpRight className="mr-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Link href="/stats">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                  צפה בסטטיסטיקות
                  <BarChart className="mr-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#4f46e5_1px,transparent_1px),linear-gradient(to_bottom,#4f46e5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-card hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                תחרויות פעילות
              </CardTitle>
              <CardDescription>טורנירים וליגות בתהליך</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.activeTournaments}</div>
              <Link href="/tournaments" className="mt-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
                צפה בכל התחרויות
                <ArrowUpRight className="mr-1 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-6 w-6 text-emerald-500" />
                משחקים קרובים
              </CardTitle>
              <CardDescription>משחקים מתוכננים</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.upcomingMatches}</div>
              <Link href="/matches" className="mt-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
                צפה בכל המשחקים
                <ArrowUpRight className="mr-1 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-500" />
                שחקנים רשומים
              </CardTitle>
              <CardDescription>סה"כ שחקנים פעילים</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.totalPlayers}</div>
              <Link href="/players" className="mt-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
                צפה בכל השחקנים
                <ArrowUpRight className="mr-1 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Latest Tournament Section */}
        {latestTournament && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">הטורניר האחרון</h2>
            </div>
            
            <Card className="border-2 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{latestTournament.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{latestTournament.date}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {getFormatLabel(latestTournament.format)}
                    </Badge>
                    <Badge variant={getStatusVariant(latestTournament.status)}>
                      {getStatusLabel(latestTournament.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                      סטטוס הטורניר
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">שחקנים:</span>
                        <span className="font-medium">{latestTournament.players}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">משחקים:</span>
                        <span className="font-medium">{latestTournament.matches}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">הושלמו:</span>
                        <span className="font-medium">{latestTournament.completedMatches} / {latestTournament.matches}</span>
                      </div>
                      {latestTournament.winner && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">מנצח:</span>
                          <span className="font-medium flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            {latestTournament.winner}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Table className="h-5 w-5 text-blue-500 mr-2" />
                      צפה בטבלה
                    </h3>
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-center text-muted-foreground mb-4">
                        לחץ על הכפתור למטה כדי לצפות בטבלת הדירוג המלאה של הטורניר
                      </p>
                      <Link href={`/tournaments/${latestTournament.id}?tab=standings`}>
                        <Button>
                          צפה בטבלת הדירוג
                          <Table className="mr-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <Trophy className="h-12 w-12 text-purple-600 dark:text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">ניהול תחרויות מתקדם</h3>
            <p className="text-muted-foreground">
              מערכת חכמה לניהול טורנירים בפורמטים שונים: נוק-אאוט, ליגה וקבוצות
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <BarChart className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">סטטיסטיקות מפורטות</h3>
            <p className="text-muted-foreground">
              מעקב אחר ביצועי שחקנים, דירוגים ותוצאות בזמן אמת
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
            <Users className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">ניהול שחקנים</h3>
            <p className="text-muted-foreground">
              מעקב אחר התקדמות השחקנים, דירוגים והישגים לאורך זמן
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

