"use client"

import { useEffect, useState } from "react"
import { TournamentForm } from "@/components/TournamentForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "../hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Trophy, Users, Edit, Trash2, Table } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { getImageUrl } from "@/lib/utils"

interface Player {
  id: string
  name: string
  rating: number
  avatar: string | null
  initials: string
  level: number
  wins: number
  losses: number
}

interface Match {
  id: string
  player1: Player
  player2: Player
  player1Score: number | null
  player2Score: number | null
  round: number
  status: string
  date: string | null
}

interface Tournament {
  id: string
  name: string
  description: string | null
  format: string
  rounds: number
  status: string
  players: Player[]
  matches: Match[]
}

export default function TournamentsPage() {
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewTournamentForm, setShowNewTournamentForm] = useState(false)
  const router = useRouter()

  const loadData = async () => {
    try {
      const [playersResponse, tournamentsResponse] = await Promise.all([
        fetch("/api/players"),
        fetch("/api/tournaments")
      ])

      if (!playersResponse.ok || !tournamentsResponse.ok) {
        throw new Error("Failed to load data")
      }

      const [playersData, tournamentsData] = await Promise.all([
        playersResponse.json(),
        tournamentsResponse.json()
      ])

      setPlayers(playersData.players)
      setTournaments(tournamentsData.tournaments)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת הנתונים",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpdateScore = async (matchId: string, player1Score: number, player2Score: number) => {
    try {
      const response = await fetch(`/api/tournaments/${matchId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player1Score,
          player2Score,
          status: 'completed'
        }),
      })

      if (!response.ok) throw new Error("Failed to update match")

      toast({
        title: "התוצאה עודכנה",
        description: "תוצאת המשחק והדירוג עודכנו בהצלחה",
      })

      // Refresh tournaments list
      const tournamentsResponse = await fetch("/api/tournaments")
      if (!tournamentsResponse.ok) throw new Error("Failed to refresh tournaments")
      
      const tournamentsData = await tournamentsResponse.json()
      setTournaments(tournamentsData.tournaments)
    } catch (error) {
      console.error("Error updating match:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון התוצאה",
        variant: "destructive",
      })
    }
  }

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'knockout':
        return 'נוק-אאוט'
      case 'league':
        return 'ליגה'
      case 'groups':
        return 'בתים + נוק-אאוט'
      default:
        return format
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'פעיל'
      case 'completed':
        return 'הסתיים'
      case 'draft':
        return 'טיוטה'
      default:
        return status
    }
  }

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

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center text-muted-foreground">טוען...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">תחרויות</h1>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowNewTournamentForm(!showNewTournamentForm)}>
            <Plus className="mr-2 h-4 w-4" />
            {showNewTournamentForm ? "סגור טופס" : "צור תחרות"}
          </Button>
        )}
      </div>

      {showNewTournamentForm && isAdmin && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <CardTitle>תחרות חדשה</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <TournamentForm 
              mode="create"
              onSuccess={() => {
                setShowNewTournamentForm(false)
                loadData()
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>תחרויות פעילות</CardTitle>
              <CardDescription>כל התחרויות במערכת</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tournaments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>אין תחרויות פעילות כרגע</p>
              {isAdmin && !showNewTournamentForm && (
                <Button
                  onClick={() => setShowNewTournamentForm(true)}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  צור תחרות
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map(tournament => (
                <Card key={tournament.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{tournament.name}</CardTitle>
                        <CardDescription>
                          {getFormatLabel(tournament.format)} | {tournament.rounds} סיבובים | {tournament.players.length} שחקנים
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {getFormatLabel(tournament.format)}
                        </Badge>
                        <Badge variant={getStatusVariant(tournament.status)}>
                          {getStatusLabel(tournament.status)}
                        </Badge>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => router.push(`/tournaments/${tournament.id}?tab=standings`)}
                          >
                            <Table className="h-3.5 w-3.5 mr-1" />
                            טבלה
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                                onClick={() => router.push(`/tournaments/${tournament.id}/edit`)}
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                ערוך
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 border-red-200 text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    מחק
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>אישור מחיקה</DialogTitle>
                                    <DialogDescription>
                                      האם אתה בטוח שברצונך למחוק את הטורניר "{tournament.name}"?
                                      פעולה זו אינה ניתנת לביטול.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter className="gap-2 sm:justify-start">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(`/api/tournaments/${tournament.id}`, {
                                            method: 'DELETE',
                                          });
                                          
                                          if (!response.ok) {
                                            throw new Error('Failed to delete tournament');
                                          }
                                          
                                          toast({
                                            title: "הצלחה",
                                            description: "הטורניר נמחק בהצלחה",
                                            variant: "default",
                                          });
                                          
                                          // רענון הדף לאחר מחיקה
                                          loadData();
                                        } catch (error) {
                                          console.error('Error deleting tournament:', error);
                                          toast({
                                            title: "שגיאה",
                                            description: "אירעה שגיאה במחיקת הטורניר",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      כן, מחק
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
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tournament.players.map(player => (
                          <div
                            key={player.id}
                            className="p-4 bg-gradient-to-br from-muted/80 to-muted rounded-lg overflow-hidden relative group hover:shadow-lg transition-all duration-300"
                          >
                            <div className="absolute top-2 right-2">
                              <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                                רמה {player.level}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-col items-center gap-3">
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-primary/5 rounded-full" />
                                <Avatar className="h-20 w-20 border-2 border-primary/20">
                                  {player.avatar ? (
                                    <div className="h-full w-full overflow-hidden rounded-full">
                                      <img 
                                        src={getImageUrl(player.avatar)} 
                                        alt={player.name} 
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          console.log('Error loading player image in tournaments page');
                                          (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <AvatarFallback className="bg-blue-50 text-blue-600 text-xs">
                                      {typeof player.initials === 'string' ? player.initials : player.name.slice(0, 2)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                              </div>
                              
                              <div className="text-center">
                                <h3 className="font-semibold text-lg">{player.name}</h3>
                                <p className="text-sm text-muted-foreground">דירוג {player.rating}</p>
                              </div>

                              <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-primary">{player.wins}</p>
                                  <p className="text-xs text-muted-foreground">נצחונות</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-primary">{player.losses}</p>
                                  <p className="text-xs text-muted-foreground">הפסדים</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium">משחקים</h3>
                        <div className="grid gap-2">
                          {tournament.matches.map(match => (
                            <div
                              key={match.id}
                              className="p-4 bg-muted/50 rounded-lg"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">סיבוב {match.round}</span>
                                  <Badge variant={match.status === "completed" ? "default" : "secondary"}>
                                    {match.status === "completed" ? "הסתיים" : "מתוכנן"}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span>{match.player1.name}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                      {match.player1Score ?? "-"} : {match.player2Score ?? "-"}
                                    </Badge>
                                  </div>
                                  <span>{match.player2.name}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

