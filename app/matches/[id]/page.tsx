"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Trophy, Edit, MapPin, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ConfettiEffect from "@/components/confetti-effect"
import { useAuth } from "@/app/hooks/use-auth"

interface Player {
  id: string
  name: string
  email: string | null
  phone: string | null
  level: number
  createdAt?: Date
  updatedAt?: Date
  rating: number
}

interface Tournament {
  id: string
  name: string
}

interface Match {
  id: string
  tournamentId: string
  tournament: Tournament
  player1Id: string
  player2Id: string
  player1: Player
  player2: Player
  player1Score: number | null
  player2Score: number | null
  player1Game1Score?: number | null
  player2Game1Score?: number | null
  player1Game2Score?: number | null
  player2Game2Score?: number | null
  player1Game3Score?: number | null
  player2Game3Score?: number | null
  player1Wins?: number
  player2Wins?: number
  currentGame?: number
  date: Date
  round: string
  status: 'scheduled' | 'in_progress' | 'completed'
  location?: string
  notes?: string
  stage?: string
  groupName?: string
  bestOfThree?: boolean
}

interface ScoresState {
  player1Score: number;
  player2Score: number;
  player1Game1Score: number;
  player2Game1Score: number;
  player1Game2Score: number;
  player2Game2Score: number;
  player1Game3Score: number;
  player2Game3Score: number;
  currentGame: number;
  editingGame: number;
  [key: string]: number; // אפשר גישה דינמית למאפיינים
}

export default function MatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const router = useRouter();
  
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useAuth()
  const [updating, setUpdating] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [scores, setScores] = useState<ScoresState>({
    player1Score: 0,
    player2Score: 0,
    player1Game1Score: 0,
    player2Game1Score: 0,
    player1Game2Score: 0,
    player2Game2Score: 0,
    player1Game3Score: 0,
    player2Game3Score: 0,
    currentGame: 1,
    editingGame: 1
  })

  // טעינת פרטי המשחק
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        console.log('Fetching match data for ID:', unwrappedParams.id);
        const response = await fetch(`/api/matches/${unwrappedParams.id}`);
        
        if (!response.ok) {
          console.error('Error response:', await response.text());
          throw new Error(`Failed to fetch match: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Match data retrieved successfully');
        setMatch(data)
        
        // אתחול הניקוד בדיאלוג העדכון
        if (data.player1Score !== null || data.player2Score !== null) {
          setScores({
            player1Score: data.player1Score || 0,
            player2Score: data.player2Score || 0,
            player1Game1Score: data.player1Game1Score || 0,
            player2Game1Score: data.player2Game1Score || 0,
            player1Game2Score: data.player1Game2Score || 0,
            player2Game2Score: data.player2Game2Score || 0,
            player1Game3Score: data.player1Game3Score || 0,
            player2Game3Score: data.player2Game3Score || 0,
            currentGame: data.currentGame || 1,
            editingGame: data.currentGame || 1
          })
        }
      } catch (error) {
        console.error('Error loading match:', error)
        toast.error("שגיאה בטעינת פרטי המשחק")
      } finally {
        setLoading(false)
      }
    }

    fetchMatch()
  }, [unwrappedParams.id])

  // עדכון תוצאות המשחק
  const updateMatchScore = async () => {
    if (!match) return
    
    setUpdating(true)
    
    try {
      // Get admin token from localStorage
      const adminToken = localStorage.getItem('adminToken')
      
      if (!isAdmin || !adminToken) {
        toast.error("אין לך הרשאות מנהל לביצוע פעולה זו");
        setUpdating(false)
        return
      }
      
      let updatedData: any = {}
      
      if (match.bestOfThree) {
        // עדכון נתוני המשחק הנוכחי
        const currentGameData: any = {
          [`player1Game${scores.editingGame}Score`]: scores[`player1Game${scores.editingGame}Score`],
          [`player2Game${scores.editingGame}Score`]: scores[`player2Game${scores.editingGame}Score`]
        }
        
        // בדיקה שהניקוד הוא לפחות 11 למנצח ויתרון של לפחות 2 נקודות
        const currentP1Score = scores[`player1Game${scores.editingGame}Score`]
        const currentP2Score = scores[`player2Game${scores.editingGame}Score`]
        const maxScore = Math.max(currentP1Score, currentP2Score)
        const minScore = Math.min(currentP1Score, currentP2Score)
        
        if (maxScore < 11) {
          toast.error("במשחק הטוב מ-3, המנצח חייב להגיע לפחות ל-11 נקודות")
          setUpdating(false)
          return
        }
        
        if (maxScore - minScore < 2) {
          toast.error("במשחק הטוב מ-3, המנצח חייב לנצח ביתרון של לפחות 2 נקודות")
          setUpdating(false)
          return
        }
        
        // חישוב מספר הניצחונות מחדש
        let player1Wins = 0
        let player2Wins = 0
        
        // בדיקת כל המשחקים שיש להם תוצאה
        for (let i = 1; i <= 3; i++) {
          const p1Score = i === scores.editingGame ? 
                        scores[`player1Game${i}Score`] : 
                        (match[`player1Game${i}Score` as keyof typeof match] as number) || 0;
                        
          const p2Score = i === scores.editingGame ? 
                        scores[`player2Game${i}Score`] : 
                        (match[`player2Game${i}Score` as keyof typeof match] as number) || 0;
          
          // אם יש תוצאה למשחק זה
          if (p1Score > 0 || p2Score > 0) {
            if (p1Score > p2Score) {
              player1Wins++
            } else if (p2Score > p1Score) {
              player2Wins++
            }
          }
        }
        
        // קביעת המשחק הבא או סיום
        let currentGame = scores.editingGame;
        let status = match.status;
        
        // אם אחד השחקנים ניצח 2 משחקים, המשחק הסתיים
        if (player1Wins >= 2 || player2Wins >= 2) {
          status = 'completed';
          currentGame = Math.min(player1Wins + player2Wins, 3);
        } else {
          // עדיין אין מנצח
          status = 'in_progress';
          
          // קביעת המשחק הבא - אם עדיין אין מנצח, המשחק הבא הוא המשחק הראשון בלי תוצאה
          // או המשחק ה-3 אם כבר יש תוצאות לשני המשחקים הראשונים
          if (player1Wins + player2Wins === 2) {
            currentGame = 3;
          } else if (player1Wins + player2Wins === 1) {
            currentGame = 2;
          } else {
            currentGame = 1;
          }
        }
        
        // עדכון הניקוד הכולל - הניקוד הכולל הוא מספר המשחקים שכל שחקן ניצח
        const player1Score = player1Wins;
        const player2Score = player2Wins;
        
        updatedData = {
          ...currentGameData,
          player1Game1Score: scores.player1Game1Score,
          player2Game1Score: scores.player2Game1Score,
          player1Game2Score: scores.player1Game2Score,
          player2Game2Score: scores.player2Game2Score, 
          player1Game3Score: scores.player1Game3Score,
          player2Game3Score: scores.player2Game3Score,
          player1Wins,
          player2Wins,
          currentGame,
          player1Score,
          player2Score,
          status
        }
      } else {
        // משחק רגיל (לא הטוב מ-3)
        updatedData = {
          player1Score: scores.player1Score,
          player2Score: scores.player2Score,
          status: 'completed'
        }
      }
      
      const response = await fetch(`/api/matches/${match.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(updatedData)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error updating match:', response.status, errorData);
        throw new Error(errorData?.error || 'Failed to update match');
      }
      
      const updatedMatch = await response.json()
      setMatch(updatedMatch)
      
      // הפעלת אנימציית קונפטי אם המשחק הסתיים
      if (updatedMatch.status === 'completed') {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      }
      
      toast.success("תוצאת המשחק עודכנה בהצלחה")
    } catch (error) {
      console.error('Error updating match:', error)
      toast.error("שגיאה בעדכון תוצאת המשחק")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-blue-800">טוען פרטי משחק...</p>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">המשחק לא נמצא</h2>
          <Link href="/matches">
            <Button variant="secondary">חזרה לרשימת המשחקים</Button>
          </Link>
        </div>
      </div>
    )
  }

  // המרת תאריך מסוג Date לפורמט תצוגה
  const formatDate = (dateStr: Date) => {
    const date = new Date(dateStr)
    return {
      date: date.toLocaleDateString('he-IL'),
      time: date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const dateTime = formatDate(match.date)

  // המרת שלב המשחק לעברית
  const getRoundDisplayName = (round: string) => {
    switch (round) {
      case 'group': return 'שלב הבתים'
      case 'round16': return 'שמינית גמר'
      case 'quarter': return 'רבע גמר'
      case 'semi': return 'חצי גמר'
      case 'final': return 'גמר'
      default: return round
    }
  }

  return (
    <div dir="rtl" className="container mx-auto py-6 space-y-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <ConfettiEffect 
        trigger={showConfetti} 
        type="win" 
        onComplete={() => setShowConfetti(false)}
      />
      <div className="flex items-center gap-2">
        <Link href="/matches">
          <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-100">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-blue-700">פרטי משחק</h1>
        <Badge
          variant={match.status === "completed" ? "secondary" : "default"}
          className={match.status === "completed" ? "bg-blue-500" : "bg-yellow-500"}
        >
          {match.status === "completed" ? "הסתיים" : "מתוכנן"}
        </Badge>
      </div>

      <Card className="border-2 border-blue-200 shadow-md hover:shadow-lg transition-all">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <CardTitle className="text-blue-800">
                {match.tournament.name} - {getRoundDisplayName(match.round)}
                {match.bestOfThree && (
                  <Badge className="ml-2 bg-yellow-100 text-yellow-800 border border-yellow-300">
                    הטוב מ-3 משחקים
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-blue-600 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {dateTime.date} בשעה {dateTime.time}
                  </span>
                </div>
                {match.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{match.location}</span>
                  </div>
                )}
              </CardDescription>
            </div>
            <Link href={`/tournaments/${match.tournamentId}`}>
              <Button variant="outline" size="sm" className="gap-1 border-blue-300 text-blue-700 hover:bg-blue-100">
                <Trophy className="h-3.5 w-3.5" />
                <span>צפה בטורניר</span>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-8 py-6 px-4 bg-blue-50 rounded-lg">
            <div className="flex flex-1 flex-col items-center text-center">
              <Avatar className="h-20 w-20 border-4 border-blue-300 mb-2">
                <AvatarFallback className="bg-blue-100 text-blue-800">
                  {match.player1.name ? match.player1.name.substring(0, 2) : ''}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-medium text-blue-800">{match.player1.name}</h3>
              <div className="flex mt-1">
                {Array.from({ length: match.player1.level || 0 }).map((_, i) => (
                  <span key={i} className="text-yellow-500">
                    ★
                  </span>
                ))}
              </div>
              {match.bestOfThree ? (
                <div className="mt-2">
                  <p className={`text-3xl font-bold ${match.status === "completed" && (match.player1Wins || 0) > (match.player2Wins || 0) ? "text-blue-700" : "text-blue-600"}`}>
                    {match.player1Wins || 0}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">משחק 1: {match.player1Game1Score !== null ? match.player1Game1Score : "-"}</p>
                    <p className="text-sm">משחק 2: {match.player1Game2Score !== null ? match.player1Game2Score : "-"}</p>
                    {(match.currentGame || 1) > 2 && (
                      <p className="text-sm">משחק 3: {match.player1Game3Score !== null ? match.player1Game3Score : "-"}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className={`text-3xl font-bold mt-2 ${match.status === "completed" && (match.player1Score || 0) > (match.player2Score || 0) ? "text-blue-700" : "text-blue-600"}`}>
                  {match.player1Score !== null ? match.player1Score : "-"}
                </p>
              )}
            </div>

            <div className="text-center py-4">
              <div className="text-xl font-bold text-blue-600 mb-2">נגד</div>
              <Badge variant="outline" className="text-lg border-2 border-blue-300 px-3 py-1">
                VS
              </Badge>
            </div>

            <div className="flex flex-1 flex-col items-center text-center">
              <Avatar className="h-20 w-20 border-4 border-blue-300 mb-2">
                <AvatarFallback className="bg-blue-100 text-blue-800">
                  {match.player2.name ? match.player2.name.substring(0, 2) : ''}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-medium text-blue-800">{match.player2.name}</h3>
              <div className="flex mt-1">
                {Array.from({ length: match.player2.level || 0 }).map((_, i) => (
                  <span key={i} className="text-yellow-500">
                    ★
                  </span>
                ))}
              </div>
              {match.bestOfThree ? (
                <div className="mt-2">
                  <p className={`text-3xl font-bold ${match.status === "completed" && (match.player2Wins || 0) > (match.player1Wins || 0) ? "text-blue-700" : "text-blue-600"}`}>
                    {match.player2Wins || 0}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">משחק 1: {match.player2Game1Score !== null ? match.player2Game1Score : "-"}</p>
                    <p className="text-sm">משחק 2: {match.player2Game2Score !== null ? match.player2Game2Score : "-"}</p>
                    {(match.currentGame || 1) > 2 && (
                      <p className="text-sm">משחק 3: {match.player2Game3Score !== null ? match.player2Game3Score : "-"}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className={`text-3xl font-bold mt-2 ${match.status === "completed" && (match.player2Score || 0) > (match.player1Score || 0) ? "text-blue-700" : "text-blue-600"}`}>
                  {match.player2Score !== null ? match.player2Score : "-"}
                </p>
              )}
            </div>
          </div>

          {match.notes && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-blue-700 mb-2">הערות</h3>
              <p className="text-blue-800 bg-blue-50 p-4 rounded-lg border border-blue-200">{match.notes}</p>
            </div>
          )}

          {isAdmin && (
            <div className="flex justify-end mt-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-green-500 hover:bg-green-600 text-white">
                    <Edit className="h-4 w-4" />
                    {match.status === "completed" ? "ערוך תוצאה" : "עדכן תוצאה"}
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl" className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{match.status === "completed" ? "עריכת תוצאות משחק" : "עדכון תוצאות משחק"}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {match.bestOfThree ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="text-center font-medium text-blue-800">
                            עריכת משחק {scores.editingGame} מתוך 3
                          </div>
                          <Select
                            value={scores.editingGame.toString()}
                            onValueChange={(value) => setScores({ ...scores, editingGame: parseInt(value) })}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="בחר משחק" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">משחק 1</SelectItem>
                              <SelectItem value="2">משחק 2</SelectItem>
                              <SelectItem value="3">משחק 3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-md">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`player1Game${scores.editingGame}Score`} className="mb-2 block font-bold">
                                {match.player1.name}
                              </Label>
                              <Input
                                id={`player1Game${scores.editingGame}Score`}
                                type="number"
                                min="0"
                                value={scores[`player1Game${scores.editingGame}Score`]}
                                onChange={(e) => setScores({ 
                                  ...scores, 
                                  [`player1Game${scores.editingGame}Score`]: parseInt(e.target.value) || 0 
                                })}
                                className="col-span-3"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`player2Game${scores.editingGame}Score`} className="mb-2 block font-bold">
                                {match.player2.name}
                              </Label>
                              <Input
                                id={`player2Game${scores.editingGame}Score`}
                                type="number"
                                min="0"
                                value={scores[`player2Game${scores.editingGame}Score`]}
                                onChange={(e) => setScores({ 
                                  ...scores, 
                                  [`player2Game${scores.editingGame}Score`]: parseInt(e.target.value) || 0 
                                })}
                                className="col-span-3"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-200">
                          <div className="text-sm font-medium text-blue-700 mb-2">סיכום תוצאות כל המשחקים:</div>
                          <div className="grid grid-cols-3 gap-2 text-sm bg-gray-50 p-3 rounded-md">
                            <div className="font-bold">סיבוב</div>
                            <div className="font-bold text-center">{match.player1.name}</div>
                            <div className="font-bold text-center">{match.player2.name}</div>
                            
                            <div>משחק 1</div>
                            <div className={`text-center ${scores.player1Game1Score > scores.player2Game1Score ? "font-bold text-blue-600" : ""}`}>
                              {scores.player1Game1Score}
                            </div>
                            <div className={`text-center ${scores.player2Game1Score > scores.player1Game1Score ? "font-bold text-blue-600" : ""}`}>
                              {scores.player2Game1Score}
                            </div>
                            
                            <div>משחק 2</div>
                            <div className={`text-center ${scores.player1Game2Score > scores.player2Game2Score ? "font-bold text-blue-600" : ""}`}>
                              {scores.player1Game2Score}
                            </div>
                            <div className={`text-center ${scores.player2Game2Score > scores.player1Game2Score ? "font-bold text-blue-600" : ""}`}>
                              {scores.player2Game2Score}
                            </div>
                            
                            <div>משחק 3</div>
                            <div className={`text-center ${scores.player1Game3Score > scores.player2Game3Score ? "font-bold text-blue-600" : ""}`}>
                              {scores.player1Game3Score}
                            </div>
                            <div className={`text-center ${scores.player2Game3Score > scores.player1Game3Score ? "font-bold text-blue-600" : ""}`}>
                              {scores.player2Game3Score}
                            </div>
                          </div>
                          
                          <div className="mt-3 bg-blue-100 p-2 rounded text-sm text-blue-800">
                            <p>תזכורת: במשחק הטוב מ-3, המנצח חייב להגיע לפחות ל-11 נקודות עם יתרון של 2 נקודות לפחות.</p>
                            <p>המנצח בטורניר הוא הראשון שמגיע ל-2 ניצחונות.</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="player1Score" className="mb-2 block">
                            {match.player1.name}
                          </Label>
                          <Input
                            id="player1Score"
                            type="number"
                            min="0"
                            value={scores.player1Score}
                            onChange={(e) => setScores({ ...scores, player1Score: parseInt(e.target.value) || 0 })}
                            className="col-span-3"
                          />
                        </div>
                        <div>
                          <Label htmlFor="player2Score" className="mb-2 block">
                            {match.player2.name}
                          </Label>
                          <Input
                            id="player2Score"
                            type="number"
                            min="0"
                            value={scores.player2Score}
                            onChange={(e) => setScores({ ...scores, player2Score: parseInt(e.target.value) || 0 })}
                            className="col-span-3"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter className="gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">ביטול</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button 
                        onClick={updateMatchScore} 
                        className="bg-green-500 hover:bg-green-600 text-white" 
                        disabled={updating}
                      >
                        {updating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            מעדכן...
                          </>
                        ) : (
                          'שמור תוצאות'
                        )}
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

