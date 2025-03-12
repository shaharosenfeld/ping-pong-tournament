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
        
        // עיבוד משחקים אחרונים
        if (matchesData && matchesData.length > 0) {
          const recent = matchesData
            .filter((match: any) => match.status === 'completed')
            .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5)
            
          setRecentMatches(recent)
        }
        
      } catch (error) {
        console.error("Error fetching homepage data:", error)
        toast({
          title: "שגיאה בטעינת נתונים",
          description: "אירעה שגיאה בעת טעינת נתוני דף הבית. נסה לרענן את העמוד.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // פונקציות עזר לתצוגה 
  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'knockout':
        return 'נוק-אאוט';
      case 'league':
        return 'ליגה';
      case 'groups':
        return 'בתים';
      default:
        return format;
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'עתידי';
      case 'active':
        return 'פעיל';
      case 'completed':
        return 'הסתיים';
      case 'canceled':
        return 'בוטל';
      default:
        return status;
    }
  };
  
  const getStatusVariant = (status: string): "default" | "secondary" | "outline" => {
    switch (status) {
      case 'upcoming':
        return 'outline';
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="pb-12">
      <div className="container mx-auto">
        {/* Welcome Header */}
        <div className="text-center my-8 md:my-12 px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-blue-700">
            ברוכים הבאים לטורניר פינג פונג מקצועי
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            מערכת לניהול טורנירי פינג פונג עם מעקב אחר משחקים, שחקנים וליגות
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 px-4 md:px-0">
          <Card className="bg-card hover:bg-accent/5 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-blue-500" />
                טורנירים פעילים
              </CardTitle>
              <CardDescription>מספר הטורנירים הפעילים כרגע</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold">{stats.activeTournaments}</div>
              <Link href="/tournaments" className="mt-3 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
                צפה בכל הטורנירים
                <ArrowUpRight className="mr-1 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card hover:bg-accent/5 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Table className="h-6 w-6 text-green-500" />
                משחקים קרובים
              </CardTitle>
              <CardDescription>המשחקים המתוכננים הקרובים</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold">{stats.upcomingMatches}</div>
              <Link href="/matches" className="mt-3 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
                צפה בכל המשחקים
                <ArrowUpRight className="mr-1 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card hover:bg-accent/5 transition-colors sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-500" />
                שחקנים רשומים
              </CardTitle>
              <CardDescription>סה"כ שחקנים פעילים</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold">{stats.totalPlayers}</div>
              <Link href="/players" className="mt-3 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
                צפה בכל השחקנים
                <ArrowUpRight className="mr-1 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Latest Tournament Section */}
        {latestTournament && (
          <div className="mb-8 md:mb-12 px-4 md:px-0">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold">הטורניר האחרון</h2>
            </div>
            
            <Card className="border overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <CardTitle className="text-lg md:text-xl">{latestTournament.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{latestTournament.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
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
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Trophy className="h-5 w-5 text-yellow-500 ml-2" />
                      סטטוס הטורניר
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">שחקנים:</span>
                        <Badge variant="outline" className="bg-white">{latestTournament.players}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">משחקים:</span>
                        <Badge variant="outline" className="bg-white">{latestTournament.matches}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">הושלמו:</span>
                        <Badge variant="outline" className="bg-white">{latestTournament.completedMatches} / {latestTournament.matches}</Badge>
                      </div>
                      {latestTournament.winner && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">מנצח:</span>
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 flex items-center">
                            <Star className="h-3 w-3 ml-1" />
                            {latestTournament.winner}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg flex flex-col justify-between">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Table className="h-5 w-5 text-blue-500 ml-2" />
                      צפה בטבלה
                    </h3>
                    <div className="flex flex-col items-center justify-center mt-2">
                      <p className="text-center text-muted-foreground mb-4 text-sm">
                        לחץ על הכפתור למטה כדי לצפות בטבלת הדירוג המלאה של הטורניר
                      </p>
                      <Link href={`/tournaments/${latestTournament.id}?tab=standings`}>
                        <Button className="w-full sm:w-auto">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 px-4 md:px-0">
          <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <Trophy className="h-10 w-10 md:h-12 md:w-12 text-purple-600 dark:text-purple-400 mb-3 md:mb-4" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">ניהול תחרויות מתקדם</h3>
            <p className="text-muted-foreground text-sm md:text-base">
              מערכת חכמה לניהול טורנירים בפורמטים שונים: נוק-אאוט, ליגה וקבוצות
            </p>
          </div>

          <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <BarChart className="h-10 w-10 md:h-12 md:w-12 text-blue-600 dark:text-blue-400 mb-3 md:mb-4" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">סטטיסטיקות מפורטות</h3>
            <p className="text-muted-foreground text-sm md:text-base">
              מעקב אחר ביצועי שחקנים, דירוגים ותוצאות בזמן אמת
            </p>
          </div>

          <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
            <Users className="h-10 w-10 md:h-12 md:w-12 text-emerald-600 dark:text-emerald-400 mb-3 md:mb-4" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">ניהול שחקנים</h3>
            <p className="text-muted-foreground text-sm md:text-base">
              מעקב אחר התקדמות השחקנים, דירוגים והישגים לאורך זמן
            </p>
          </div>
        </div>
        
        {/* PaddleBot Section */}
        <div className="mt-6 px-4 md:px-0">
          <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <div className="h-12 w-12 flex items-center justify-center text-xl font-bold text-blue-600 border-2 border-blue-200 rounded-lg">
                  PaddleBot
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-center sm:text-right">עוזר חכם לניהול טורנירים</h3>
                <p className="text-muted-foreground text-sm md:text-base text-center sm:text-right">
                  הכירו את ה-PaddleBot, המסייע בארגון טורנירים, הגרלת משחקים והמלצות לשיבוץ שחקנים
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

