"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Phone, Edit, Calendar, Trash2, Loader2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { getImageUrl } from "@/lib/utils"
import { useAuth } from "@/app/hooks/use-auth"
import { getAuthHeaders } from "@/lib/admin-utils"

interface PlayerStats {
  wins: number
  losses: number
  winRate: number
  tournamentsWon: number
  tournamentsPlayed: number
  averageScore: number
}

interface Match {
  id: string
  opponent: string
  result?: string
  score?: string
  date: string
  time?: string
  tournament?: string
}

interface Player {
  id: string
  name: string
  email: string | null
  phone: string | null
  avatar?: string
  initials: string
  level: number
  bio?: string
  wins: number
  losses: number
  rating: number
  createdAt?: string
  updatedAt?: string
  stats: PlayerStats
  recentMatches: Match[]
  upcomingMatches: Match[]
}

export default function PlayerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchPlayer()
  }, [unwrappedParams.id])

  const fetchPlayer = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/players/${unwrappedParams.id}?t=${new Date().getTime()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch player')
      }
      
      const playerData = await response.json()
      console.log('Fetched player data:', playerData);
      
      // Calculate win rate
      const winRate = playerData.wins + playerData.losses > 0
        ? Math.round((playerData.wins / (playerData.wins + playerData.losses)) * 100)
        : 0

      // Fetch player tournament stats
      const tournamentStats = await fetch(`/api/players/${unwrappedParams.id}/tournaments?t=${new Date().getTime()}`).then(res => {
        if (!res.ok) return { tournamentsWon: 0, tournamentsPlayed: 0 };
        return res.json();
      }).catch(() => ({ tournamentsWon: 0, tournamentsPlayed: 0 }));
      
      console.log('Fetched tournament stats:', tournamentStats);

      // Create a player object with required structure
      setPlayer({
        ...playerData,
        stats: {
          wins: playerData.wins || 0,
          losses: playerData.losses || 0,
          winRate: winRate,
          tournamentsWon: tournamentStats.tournamentsWon || 0,
          tournamentsPlayed: tournamentStats.tournamentsPlayed || 0,
          averageScore: Math.round(playerData.rating / 100) || 0,
        },
        // Empty arrays for now - you can fetch these separately if needed
        recentMatches: [],
        upcomingMatches: []
      })
    } catch (error) {
      console.error('Error fetching player:', error)
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת פרטי השחקן",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("האם אתה בטוח שברצונך למחוק שחקן זה? פעולה זו אינה הפיכה.")) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/players/${unwrappedParams.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to delete player: ${errorData?.error || response.statusText}`)
      }

      toast({
        title: "מחיקת שחקן",
        description: "השחקן נמחק בהצלחה",
      })
      router.push('/players')
    } catch (error) {
      console.error('Error deleting player:', error)
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת השחקן",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRefreshPlayerStats = async () => {
    if (!player) return;
    
    setRefreshing(true);
    try {
      // Call API to recalculate all stats
      const response = await fetch(`/api/players/${player.id}/refresh-stats`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh player statistics');
      }
      
      toast({
        title: "הצלחה",
        description: "סטטיסטיקות השחקן עודכנו בהצלחה",
      });
      
      // Refresh player data
      fetchPlayer();
    } catch (error) {
      console.error('Error refreshing player stats:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון סטטיסטיקות השחקן",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="container mx-auto py-6 space-y-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <div className="flex items-center gap-2">
          <Link href="/players">
            <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-100">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-blue-700">פרופיל שחקן</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-blue-800">טוען פרטי שחקן...</div>
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <div dir="rtl" className="container mx-auto py-6 space-y-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <div className="flex items-center gap-2">
          <Link href="/players">
            <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-100">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-blue-700">פרופיל שחקן</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">לא נמצאו פרטי שחקן</div>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="container mx-auto py-6 space-y-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="flex items-center gap-2">
        <Link href="/players">
          <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-100">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-blue-700">פרופיל שחקן</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-2 border-blue-200 shadow-md hover:shadow-lg transition-all">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 flex flex-col items-center text-center">
            <Avatar className="h-32 w-32 border-4 border-blue-300 mb-2">
              {player.avatar ? (
                <div className="h-full w-full overflow-hidden rounded-full">
                  <img 
                    src={getImageUrl(player.avatar)} 
                    alt={player.name} 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      console.log('Error loading player image in player profile page');
                      (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                    }}
                  />
                </div>
              ) : (
                <AvatarFallback className="bg-blue-100 text-blue-800 text-2xl">{player.initials}</AvatarFallback>
              )}
            </Avatar>
            <CardTitle className="text-xl text-blue-800">{player.name}</CardTitle>
            <div className="flex mt-1">
              {Array.from({ length: player.level }).map((_, i) => (
                <span key={i} className="text-yellow-500">
                  ★
                </span>
              ))}
            </div>
            <CardDescription className="text-blue-600 mt-1">
              רמה:{" "}
              {player.level === 5
                ? "מקצועי"
                : player.level === 4
                  ? "מתקדם"
                  : player.level === 3
                    ? "בינוני"
                    : player.level === 2
                      ? "מתחיל מתקדם"
                      : "מתחיל"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Mail className="h-4 w-4 text-blue-500" />
              <span>{player.email}</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700">
              <Phone className="h-4 w-4 text-blue-500" />
              <span>{player.phone}</span>
            </div>
            {player.bio && (
              <div className="mt-4 pt-4 border-t border-blue-100">
                <h3 className="text-md font-medium text-blue-700 mb-2">על השחקן</h3>
                <p className="text-blue-800">{player.bio}</p>
              </div>
            )}
            {isAdmin && (
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={handleRefreshPlayerStats}
                  disabled={refreshing}
                  className="ml-2"
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      מעדכן...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      עדכון סטטיסטיקות
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  asChild
                >
                  <Link href={`/players/${player.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    ערוך שחקן
                  </Link>
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  מחק שחקן
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-2 border-blue-200 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
              <CardTitle className="text-lg text-blue-800">סטטיסטיקות</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
                  <p className="text-sm text-blue-600">ניצחונות / הפסדים</p>
                  <p className="text-xl font-bold text-blue-800">
                    {player.stats.wins} / {player.stats.losses}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
                  <p className="text-sm text-blue-600">אחוז ניצחונות</p>
                  <p className="text-xl font-bold text-blue-800">{player.stats.winRate}%</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
                  <p className="text-sm text-blue-600">טורנירים</p>
                  <p className="text-xl font-bold text-blue-800">
                    {player.stats.tournamentsWon} / {player.stats.tournamentsPlayed}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100 md:col-span-3">
                  <p className="text-sm text-blue-600">דירוג ELO</p>
                  <p className="text-xl font-bold text-blue-800">{player.rating}</p>
                  <p className="text-xs text-blue-500">(ניקוד ממוצע: {player.stats.averageScore})</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
              <CardTitle className="text-lg text-blue-800">משחקים אחרונים</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {player.recentMatches.length > 0 ? (
                <div className="space-y-3">
                  {player.recentMatches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={match.result === "ניצחון" ? "default" : "secondary"}
                          className={match.result === "ניצחון" ? "bg-green-500" : "bg-red-500"}
                        >
                          {match.result}
                        </Badge>
                        <span className="text-blue-800">נגד {match.opponent}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-blue-700 font-medium">{match.score}</span>
                        <span className="text-blue-600 text-sm flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(match.date).toLocaleDateString("he-IL")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-blue-600 text-center py-4">אין משחקים אחרונים להצגה</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
              <CardTitle className="text-lg text-blue-800">משחקים מתוכננים</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {player.upcomingMatches.length > 0 ? (
                <div className="space-y-3">
                  {player.upcomingMatches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="border-blue-300 text-blue-700">
                          מתוכנן
                        </Badge>
                        <span className="text-blue-800">נגד {match.opponent}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-blue-700 font-medium">{match.tournament}</span>
                        <span className="text-blue-600 text-sm flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(match.date).toLocaleDateString("he-IL")} {match.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-blue-600 text-center py-4">אין משחקים מתוכננים להצגה</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

