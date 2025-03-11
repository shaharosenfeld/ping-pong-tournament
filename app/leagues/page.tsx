"use client"

import { useEffect, useState } from "react"
import { LeagueManager } from "@/components/LeagueManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Player {
  id: string
  name: string
  rating: number
}

interface LeagueMatch {
  id: string
  player1: Player
  player2: Player
  player1Score: number | null
  player2Score: number | null
  round: number
  status: string
  date: string | null
}

interface League {
  id: string
  name: string
  description: string | null
  rounds: number
  status: string
  players: Player[]
  matches: LeagueMatch[]
}

export default function LeaguesPage() {
  const { toast } = useToast()
  const [players, setPlayers] = useState<Player[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewLeagueForm, setShowNewLeagueForm] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        // טעינת שחקנים
        const playersResponse = await fetch("/api/players")
        const playersData = await playersResponse.json()
        setPlayers(playersData.players)

        // טעינת ליגות
        const leaguesResponse = await fetch("/api/leagues")
        const leaguesData = await leaguesResponse.json()
        setLeagues(leaguesData.leagues)
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

    loadData()
  }, [toast])

  const handleUpdateScore = async (matchId: string, player1Score: number, player2Score: number) => {
    try {
      const response = await fetch("/api/leagues", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId,
          player1Score,
          player2Score,
        }),
      })

      if (!response.ok) throw new Error("Failed to update match")

      toast({
        title: "התוצאה עודכנה",
        description: "תוצאת המשחק והדירוג עודכנו בהצלחה",
        variant: "default",
      })

      // רענון הנתונים
      const leaguesResponse = await fetch("/api/leagues")
      const leaguesData = await leaguesResponse.json()
      setLeagues(leaguesData.leagues)
    } catch (error) {
      console.error("Error updating match:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון התוצאה",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="text-center p-8">טוען...</div>
  }

  return (
    <div dir="rtl" className="container mx-auto py-6 space-y-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-100">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-blue-700">ניהול ליגות</h1>
        </div>
        <Button
          onClick={() => setShowNewLeagueForm(!showNewLeagueForm)}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          {showNewLeagueForm ? "סגור טופס" : "צור ליגה חדשה"}
        </Button>
      </div>

      {showNewLeagueForm && (
        <div className="mb-8">
          <LeagueManager />
        </div>
      )}

      <div className="space-y-6">
        {leagues.length === 0 ? (
          <Card className="border-2 border-blue-200 shadow-md">
            <CardContent className="py-8 text-center">
              <p className="text-blue-600">אין ליגות פעילות כרגע</p>
              {!showNewLeagueForm && (
                <Button
                  onClick={() => setShowNewLeagueForm(true)}
                  className="mt-4 bg-green-500 hover:bg-green-600 text-white"
                >
                  צור ליגה חדשה
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          leagues.map(league => (
            <Card key={league.id} className="border-2 border-blue-200 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-blue-800">{league.name}</CardTitle>
                    <CardDescription className="text-blue-600">
                      {league.rounds} סיבובים | {league.players.length} שחקנים
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={`
                      ${league.status === "active" ? "border-green-500 text-green-700" : ""}
                      ${league.status === "completed" ? "border-blue-500 text-blue-700" : ""}
                      ${league.status === "draft" ? "border-gray-500 text-gray-700" : ""}
                    `}
                  >
                    {league.status === "active" ? "פעיל" : league.status === "completed" ? "הסתיים" : "טיוטה"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {league.players.map(player => (
                      <div
                        key={player.id}
                        className="p-3 bg-blue-50 rounded-lg flex justify-between items-center"
                      >
                        <span>{player.name}</span>
                        <Badge variant="secondary">{player.rating}</Badge>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium text-blue-800">משחקים</h3>
                    <div className="grid gap-2">
                      {league.matches.map(match => (
                        <div
                          key={match.id}
                          className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span>סיבוב {match.round}</span>
                              <Badge
                                variant="outline"
                                className={`
                                  ${match.status === "scheduled" ? "border-yellow-500 text-yellow-700" : ""}
                                  ${match.status === "completed" ? "border-green-500 text-green-700" : ""}
                                `}
                              >
                                {match.status === "scheduled" ? "מתוכנן" : "הסתיים"}
                              </Badge>
                            </div>
                            {match.status === "scheduled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const score1 = prompt(`תוצאה עבור ${match.player1.name}:`)
                                  const score2 = prompt(`תוצאה עבור ${match.player2.name}:`)
                                  if (score1 && score2) {
                                    handleUpdateScore(match.id, parseInt(score1), parseInt(score2))
                                  }
                                }}
                              >
                                עדכן תוצאה
                              </Button>
                            )}
                          </div>
                          <div className="mt-2 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span>{match.player1.name}</span>
                              <Badge variant="secondary">{match.player1.rating}</Badge>
                            </div>
                            <div className="text-xl font-bold text-blue-800">
                              {match.status === "completed" ? (
                                `${match.player1Score} - ${match.player2Score}`
                              ) : (
                                "VS"
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{match.player2.rating}</Badge>
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
          ))
        )}
      </div>
    </div>
  )
} 