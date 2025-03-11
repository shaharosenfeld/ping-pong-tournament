"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { ArrowLeft, Calendar, Edit, MapPin, Plus, Trash2, Trophy, Users, Star, Award, Info } from "lucide-react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/hooks/use-auth"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TournamentBracket } from "@/components/tournament-bracket"
import ConfettiEffect from "@/components/confetti-effect"

// Import without type issues
import dynamic from 'next/dynamic'
const MatchesList = dynamic(() => import('@/components/matches-list').then(mod => mod.MatchesList))
const PlayersList = dynamic(() => import('@/components/players-list').then(mod => mod.PlayersList))

interface Player {
  id: string
  name: string
  email: string | null
  phone: string | null
  avatar: string | null
  initials: string | null
  level: number
  bio: string | null
  rating: number
  wins: number
  losses: number
}

interface Match {
  id: string
  tournamentId: string
  player1Id: string
  player2Id: string
  player1Score: number | null
  player2Score: number | null
  round: number
  status: string
  date: string | null
  player1: Player
  player2: Player
  groupName?: string
  stage?: string
  bestOfThree?: boolean
}

interface Tournament {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: Date | null
  status: string
  format: string
  players: Player[]
  matches: Match[]
  createdAt: Date
  updatedAt: Date
  location?: string
}

export default function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const { id } = use(params)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('matches')
  const [deletePassword, setDeletePassword] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [currentRound, setCurrentRound] = useState<number>(1)
  const [selectedTab, setSelectedTab] = useState<string>('matches')
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiShown, setConfettiShown] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  // Group matches by round
  const groupMatches = tournament?.matches.filter(match => match.stage === 'group') || []
  const knockoutMatches = tournament?.matches.filter(match => match.stage === 'knockout') || []
  
  // Organize group matches by round
  const groupMatchesByRound: Record<number, Match[]> = {}
  groupMatches.forEach(match => {
    const round = match.round || 1
    if (!groupMatchesByRound[round]) {
      groupMatchesByRound[round] = []
    }
    groupMatchesByRound[round].push(match)
  })
  
  // Check if all group matches are completed
  const isAllGroupMatchesCompleted = groupMatches.length > 0 && 
    groupMatches.every(match => match.status === 'completed')

  const loadTournament = async () => {
    try {
      const response = await fetch(`/api/tournaments/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to load tournament')
      }
      
      const data = await response.json()
      setTournament(data)
    } catch (error) {
      console.error('Error loading tournament:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    loadTournament()
  }, [id])
  
  // הוסף אפקט קונפטי כאשר טוען טורניר שהסתיים לראשונה
  useEffect(() => {
    // רק אם הטורניר הסתיים, הטעינה הסתיימה, הקונפטי עוד לא הוצג, ואנחנו בדפדפן
    if (tournament && tournament.status === 'completed' && !isLoading && !confettiShown && typeof window !== 'undefined') {
      // סמן שהקונפטי הוצג כבר כדי שלא יופעל שוב
      setConfettiShown(true)
      
      // הפעל את הקונפטי
      setShowConfetti(true)
      
      // עצור את הקונפטי אחרי זמן קצר
      setTimeout(() => {
        setShowConfetti(false)
      }, 1000) // רק שנייה אחת
    }
  }, [tournament, isLoading, confettiShown])
  
  // פונקציה ליצירת שלב הנוק-אאוט
  const generateKnockout = async () => {
    setGenerating(true)
    
    try {
      // השגת טוקן מנהל
      const adminToken = localStorage.getItem('adminToken') || '';
      
      // אם אין טוקן, מציגים הודעת שגיאה
      if (!isAdmin || !adminToken) {
        toast.error("אין לך הרשאות מנהל לביצוע פעולה זו");
        setGenerating(false)
        
        // אין צורך בקוד זה כי AdminCheck כבר מטפל בהפניה לדף הלוגין במידת הצורך
        // setTimeout(() => router.push('/login'), 1500);
        return
      }
      
      const response = await fetch(`/api/tournaments/${id}/generate-knockout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}` // הוספת כותרת אוטוריזציה
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error("אין הרשאות מנהל");
          // אין צורך בקוד זה כי AdminCheck כבר מטפל בהפניה לדף הלוגין במידת הצורך
          // setTimeout(() => router.push('/login'), 1500);
          return;
        }
        
        const errorData = await response.json();
        toast.error(errorData.error || "שגיאה ביצירת שלב הנוק-אאוט");
        return;
      }
      
      toast.success("שלב הנוק-אאוט נוצר בהצלחה");
      
      // טעינה מחדש של נתוני הטורניר
      await loadTournament();
    } catch (error) {
      console.error("Error:", error);
      toast.error("אירעה שגיאה ביצירת שלב הנוק-אאוט");
    } finally {
      toast.dismiss();
      setGenerating(false)
    }
  }
  
  if (isLoading) {
    return <div className="container py-8 text-center">טוען...</div>
  }
  
  if (!tournament) {
    return <div className="container py-8 text-center">הטורניר לא נמצא</div>
  }
  
  // Convert tournament data format to match the components
  const convertedMatches = tournament.matches.map(match => ({
    id: match.id,
    player1: {
      id: match.player1Id,
      name: match.player1?.name || "שחקן 1",
      level: match.player1?.level || 0
    },
    player2: {
      id: match.player2Id,
      name: match.player2?.name || "שחקן 2",
      level: match.player2?.level || 0
    },
    score1: match.player1Score === null ? undefined : match.player1Score,
    score2: match.player2Score === null ? undefined : match.player2Score,
    status: match.status as any,
    date: match.date || new Date().toISOString(),
    time: "12:00", // Default time
    location: tournament.location,
    round: String(match.round)
  }));

  const convertedPlayers = tournament.players.map(player => ({
    id: player.id,
    name: player.name,
    avatar: player.avatar || undefined,
    initials: player.initials || "",
    wins: player.wins,
    losses: player.losses,
    level: player.level
  }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-gray-500">טיוטה</Badge>
      case "active":
        return <Badge className="bg-green-500">פעיל</Badge>
      case "completed":
        return <Badge className="bg-blue-500">הסתיים</Badge>
      default:
        return null
    }
  }

  const getFormatLabel = (format: string) => {
    switch (format) {
      case "knockout":
        return "נוק-אאוט"
      case "league":
        return "ליגה"
      case "group+knockout":
        return "בתים + נוק-אאוט"
      default:
        return format
    }
  }

  return (
    <div dir="rtl" className="container mx-auto py-6 space-y-6">
      <ConfettiEffect 
        trigger={showConfetti} 
        type="tournament" 
        duration={5000}
        onComplete={() => setShowConfetti(false)}
      />
      
      <div className="flex items-center gap-2">
        <Link href="/tournaments">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>חזרה</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-blue-700">{tournament.name}</h1>
        {getStatusBadge(tournament.status)}
        
        <div className="ml-auto flex items-center gap-2">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => window.location.href = `/tournaments/${id}/edit`}
              >
                <Edit className="h-4 w-4 mr-2" />
                ערוך
              </Button>
              
              {tournament.format.includes('group') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-200 text-green-700 hover:bg-green-50"
                  onClick={generateKnockout}
                  disabled={!isAllGroupMatchesCompleted || generating}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  צור שלב נוק-אאוט
                </Button>
              )}

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    מחק טורניר
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>אישור מחיקה</DialogTitle>
                    <DialogDescription>
                      האם אתה בטוח שברצונך למחוק את הטורניר הזה?
                      פעולה זו אינה ניתנת לביטול.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <label htmlFor="admin-password" className="text-sm font-medium">
                        סיסמת מנהל
                      </label>
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="הזן סיסמת מנהל לאישור"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                      />
                    </div>
                    
                    {deleteError && (
                      <div className="text-sm text-red-500">
                        {deleteError}
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter className="gap-2 sm:justify-start">
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isDeleting}
                      onClick={async () => {
                        if (deletePassword !== '8891') {
                          setDeleteError("סיסמה שגויה. אנא נסה שנית.");
                          return;
                        }
                        
                        setIsDeleting(true);
                        setDeleteError("");
                        
                        try {
                          const adminToken = localStorage.getItem('adminToken') || `admin-${deletePassword}`;
                          
                          const response = await fetch(`/api/tournaments/${id}`, {
                            method: 'DELETE',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${adminToken}`
                            }
                          });
                          
                          if (!response.ok) {
                            throw new Error('Failed to delete tournament');
                          }
                          
                          toast.success("הטורניר נמחק בהצלחה");
                          
                          router.push('/tournaments');
                        } catch (error) {
                          console.error('Error deleting tournament:', error);
                          toast.error("אירעה שגיאה במחיקת הטורניר");
                          setDeleteError("אירעה שגיאה במחיקת הטורניר. אנא נסה שנית.");
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                    >
                      {isDeleting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          מוחק...
                        </>
                      ) : (
                        "כן, מחק"
                      )}
                    </Button>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        ביטול
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <Card className="border-2 border-blue-200 shadow-md hover:shadow-lg transition-all">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
          <CardTitle className="text-xl text-blue-800">פרטי הטורניר</CardTitle>
          <CardDescription className="text-blue-600">{tournament.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span>
              {new Date(tournament.startDate).toLocaleDateString("he-IL")} -{" "}
              {tournament.endDate ? new Date(tournament.endDate).toLocaleDateString("he-IL") : "לא נקבע"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-blue-700">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span>{tournament.location || "לא צוין מיקום"}</span>
          </div>
          <div className="flex items-center gap-2 text-blue-700">
            <Trophy className="h-4 w-4 text-blue-500" />
            <span>{getFormatLabel(tournament.format)}</span>
          </div>
          <div className="flex items-center gap-2 text-blue-700 md:col-span-3">
            <Users className="h-4 w-4 text-blue-500" />
            <span>
              {tournament.players.length} / 8 שחקנים
            </span>
            {tournament.players.length < 8 && tournament.status !== "completed" && isAdmin && (
              <Link href={`/tournaments/${id}/players/add`} className="mr-auto">
                <Button size="sm" variant="outline" className="gap-1 border-blue-300 text-blue-700 hover:bg-blue-100">
                  <Plus className="h-3.5 w-3.5" />
                  הוסף שחקנים
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8">
        {!isAllGroupMatchesCompleted && tournament.format.includes('group') && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertTitle className="flex items-center text-amber-800">
              <Info className="h-4 w-4 mr-2" />
              הודעה חשובה
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              לא ניתן ליצור שלב נוק-אאוט עד שכל משחקי הבתים יסתיימו.
              יש להזין תוצאות לכל המשחקים בשלב הבתים.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
            <TabsTrigger value="matches">משחקים</TabsTrigger>
            <TabsTrigger value="players">שחקנים</TabsTrigger>
            <TabsTrigger value="standings">טבלה</TabsTrigger>
            {tournament && tournament.status === "completed" && (
              <TabsTrigger value="results">דירוג</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="matches" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-blue-700">משחקים</h2>
              {tournament.status !== "completed" && isAdmin && (
                <Link href={`/tournaments/${id}/matches/new`}>
                  <Button size="sm" className="gap-1 bg-green-500 hover:bg-green-600 text-white">
                    <Plus className="h-3.5 w-3.5" />
                    הוסף משחק
                  </Button>
                </Link>
              )}
            </div>
            
            {tournament.format.includes('group') && groupMatches.length > 0 ? (
              // תצוגה מיוחדת לפורמט בתים + נוק-אאוט
              <div className="space-y-8">
                {/* משחקי הבתים */}
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 shadow-md">
                  <h3 className="text-lg font-bold text-blue-800 mb-4">שלב הבתים</h3>
                  
                  {/* חלוקה לפי בתים */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from(new Set(tournament.matches
                      .filter(match => match.stage === 'group')
                      .map(match => match.groupName)))
                      .filter(Boolean)
                      .sort()
                      .map(groupName => (
                        <div key={groupName} className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                          <h4 className="text-md font-bold text-blue-700 mb-3 border-b pb-2">{groupName}</h4>
                          
                          {/* משחקי הבית */}
                          <div className="space-y-3">
                            {tournament.matches
                              .filter(match => match.stage === 'group' && match.groupName === groupName)
                              .sort((a, b) => {
                                // סידור לפי סטטוס (קודם משחקים שהסתיימו) ואז לפי תאריך
                                if (a.status === 'completed' && b.status !== 'completed') return -1;
                                if (a.status !== 'completed' && b.status === 'completed') return 1;
                                return new Date(a.date || '').getTime() - new Date(b.date || '').getTime();
                              })
                              .map(match => {
                                const p1 = tournament.players.find(p => p.id === match.player1Id);
                                const p2 = tournament.players.find(p => p.id === match.player2Id);
                                const winner = match.status === "completed" && match.player1Score !== null && match.player2Score !== null
                                  ? match.player1Score > match.player2Score ? 1 : 2 
                                  : 0;
                                
                                return (
                                  <Link 
                                    href={`/matches/${match.id}`} 
                                    key={match.id} 
                                    className="block p-3 border rounded-lg hover:bg-blue-50 transition-colors"
                                  >
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <div className={`flex items-center ${winner === 1 ? "font-bold text-blue-700" : ""}`}>
                                          {p1?.name || "שחקן 1"}
                                        </div>
                                        <span className="text-gray-500 mx-1">vs</span>
                                        <div className={`flex items-center ${winner === 2 ? "font-bold text-blue-700" : ""}`}>
                                          {p2?.name || "שחקן 2"}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {match.status === "completed" ? (
                                          <span className="font-bold">
                                            {match.player1Score} - {match.player2Score}
                                          </span>
                                        ) : (
                                          <Badge variant="outline" className="text-xs">
                                            {match.status === "scheduled" ? "מתוכנן" : "בתהליך"}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </Link>
                                );
                              })}
                          </div>
                          
                          {/* טבלת דירוג הבית */}
                          <div className="mt-4 pt-3 border-t">
                            <h5 className="text-sm font-bold text-blue-600 mb-2">דירוג הבית</h5>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-blue-50">
                                  <th className="py-1 px-2 text-right">#</th>
                                  <th className="py-1 px-2 text-right">שחקן</th>
                                  <th className="py-1 px-2 text-center">נצ'</th>
                                  <th className="py-1 px-2 text-center">הפ'</th>
                                  <th className="py-1 px-2 text-center">הפרש</th>
                                  <th className="py-1 px-2 text-center">נק'</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tournament.players
                                  .filter(player => {
                                    // בדיקה אם השחקן שייך לבית הזה
                                    return tournament.matches.some(m => 
                                      m.stage === 'group' && 
                                      m.groupName === groupName && 
                                      (m.player1Id === player.id || m.player2Id === player.id)
                                    );
                                  })
                                  .map(player => {
                                    // חישוב סטטיסטיקות השחקן בבית הזה
                                    const groupMatches = tournament.matches.filter(m => 
                                      m.stage === 'group' && 
                                      m.groupName === groupName && 
                                      (m.player1Id === player.id || m.player2Id === player.id) &&
                                      m.status === 'completed'
                                    );
                                    
                                    const wins = groupMatches.filter(m => 
                                      (m.player1Id === player.id && m.player1Score !== null && m.player2Score !== null && m.player1Score > m.player2Score) ||
                                      (m.player2Id === player.id && m.player1Score !== null && m.player2Score !== null && m.player2Score > m.player1Score)
                                    ).length;
                                    
                                    const losses = groupMatches.filter(m => 
                                      (m.player1Id === player.id && m.player1Score !== null && m.player2Score !== null && m.player1Score < m.player2Score) ||
                                      (m.player2Id === player.id && m.player1Score !== null && m.player2Score !== null && m.player2Score < m.player1Score)
                                    ).length;
                                    
                                    // חישוב נקודות שהושגו ונקודות שספג
                                    let pointsFor = 0;
                                    let pointsAgainst = 0;
                                    
                                    groupMatches.forEach(m => {
                                      if (m.player1Id === player.id) {
                                        pointsFor += m.player1Score || 0;
                                        pointsAgainst += m.player2Score || 0;
                                      } else {
                                        pointsFor += m.player2Score || 0;
                                        pointsAgainst += m.player1Score || 0;
                                      }
                                    });
                                    
                                    return {
                                      player,
                                      wins,
                                      losses,
                                      points: wins * 3,
                                      played: wins + losses,
                                      pointsFor,
                                      pointsAgainst,
                                      pointsDiff: pointsFor - pointsAgainst
                                    };
                                  })
                                  .sort((a, b) => {
                                    // מיון לפי נקודות
                                    if (a.points !== b.points) return b.points - a.points;
                                    
                                    // אם יש שוויון בנקודות, מיון לפי הפרש נקודות
                                    return b.pointsDiff - a.pointsDiff;
                                  })
                                  .map((stats, index) => (
                                    <tr key={stats.player.id} className={index % 2 === 0 ? "" : "bg-gray-50"}>
                                      <td className="py-1 px-2 text-right">{index + 1}</td>
                                      <td className="py-1 px-2 text-right font-medium">{stats.player.name}</td>
                                      <td className="py-1 px-2 text-center text-green-600">{stats.wins}</td>
                                      <td className="py-1 px-2 text-center text-red-600">{stats.losses}</td>
                                      <td className="py-1 px-2 text-center text-blue-600">{stats.pointsDiff > 0 ? '+' : ''}{stats.pointsDiff}</td>
                                      <td className="py-1 px-2 text-center font-bold">{stats.points}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                
                {/* משחקי הנוק-אאוט */}
                {knockoutMatches.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200 shadow-md">
                    <h3 className="text-lg font-bold text-green-800 mb-4">שלב הנוק-אאוט</h3>
                    
                    <div className="overflow-x-auto">
                      <div className="min-w-[800px] p-4">
                        <div className="flex justify-around">
                          {/* סיבובים */}
                          {Array.from(new Set(knockoutMatches.map(m => m.round)))
                            .sort((a, b) => a - b)
                            .map((round, roundIndex) => {
                              const roundMatches = knockoutMatches.filter(m => m.round === round);
                              const maxRound = Math.max(...knockoutMatches.map(m => m.round));
                              
                              return (
                                <div 
                                  key={`round-${round}`} 
                                  className="flex flex-col gap-8 items-center"
                                >
                                  <h4 className="text-lg font-bold text-green-700 mb-2">
                                    {round === maxRound
                                      ? "גמר" 
                                      : round === maxRound - 1 
                                      ? "חצי גמר" 
                                      : round === maxRound - 2
                                      ? "רבע גמר"
                                      : `סיבוב ${round}`}
                                  </h4>
                                  
                                  {roundMatches.map(match => {
                                    const p1 = tournament.players.find(p => p.id === match.player1Id);
                                    const p2 = tournament.players.find(p => p.id === match.player2Id);
                                    const winner = match.status === "completed" && match.player1Score !== null && match.player2Score !== null
                                      ? match.player1Score > match.player2Score ? 1 : 2 
                                      : 0;
                                    
                                    return (
                                      <Link
                                        href={`/matches/${match.id}`}
                                        key={match.id} 
                                        className={`block p-3 border-2 ${winner === 1 ? "border-t-green-400" : winner === 2 ? "border-b-green-400" : "border-gray-200"} rounded-lg bg-white shadow-sm min-w-[220px] hover:shadow-md transition-shadow`}
                                      >
                                        <div className={`flex items-center p-2 rounded-t ${winner === 1 ? "bg-green-100" : ""}`}>
                                          <span className="font-medium flex-1 truncate">{p1?.name || "שחקן 1"}</span>
                                          <span className="text-center min-w-[30px]">
                                            {match.status === "completed" ? match.player1Score : ""}
                                          </span>
                                        </div>
                                        <div className={`flex items-center p-2 rounded-b ${winner === 2 ? "bg-green-100" : ""}`}>
                                          <span className="font-medium flex-1 truncate">{p2?.name || "שחקן 2"}</span>
                                          <span className="text-center min-w-[30px]">
                                            {match.status === "completed" ? match.player2Score : ""}
                                          </span>
                                        </div>
                                      </Link>
                                    );
                                  })}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // תצוגה רגילה
              <>
                {convertedMatches && convertedMatches.length > 0 ? (
                  <MatchesList matches={convertedMatches} />
                ) : (
                  <div className="text-center text-gray-500 py-6">אין משחקים להצגה</div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="players" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-blue-700">שחקנים</h2>
              {tournament.players.length < 8 && tournament.status !== "completed" && isAdmin && (
                <Link href={`/tournaments/${id}/players/add`}>
                  <Button size="sm" className="gap-1 bg-green-500 hover:bg-green-600 text-white">
                    <Plus className="h-3.5 w-3.5" />
                    הוסף שחקנים
                  </Button>
                </Link>
              )}
            </div>
            
            <PlayersList tournament={tournament} players={convertedPlayers} isAdmin={isAdmin} />
          </TabsContent>
          
          <TabsContent value="standings" className="space-y-4">
            <h2 className="text-lg font-semibold text-blue-700">טבלת דירוג</h2>
            <TournamentBracket tournament={tournament} />
          </TabsContent>

          {tournament.status === "completed" && (
            <TabsContent value="results" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-blue-700">דירוג סופי</h2>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="py-1 px-2 text-right">#</th>
                      <th className="py-1 px-2 text-right">שחקן</th>
                      <th className="py-1 px-2 text-center">נצ'</th>
                      <th className="py-1 px-2 text-center">הפ'</th>
                      <th className="py-1 px-2 text-center">הפרש</th>
                      <th className="py-1 px-2 text-center">נק'</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournament.players
                      .map((player, index) => (
                        <tr key={player.id} className={index % 2 === 0 ? "" : "bg-gray-50"}>
                          <td className="py-1 px-2 text-right">{index + 1}</td>
                          <td className="py-1 px-2 text-right font-medium">{player.name}</td>
                          <td className="py-1 px-2 text-center text-green-600">{player.wins}</td>
                          <td className="py-1 px-2 text-center text-red-600">{player.losses}</td>
                          <td className="py-1 px-2 text-center">{player.rating || 0}</td>
                          <td className="py-1 px-2 text-center text-blue-600">{player.wins * 3}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}