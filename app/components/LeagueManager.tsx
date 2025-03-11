"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface Player {
  id: string
  name: string
  rating: number
}

interface LeagueManagerProps {
  players: Player[]
}

export function LeagueManager({ players }: LeagueManagerProps) {
  const { toast } = useToast()
  const [numRounds, setNumRounds] = useState(1)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateLeague = async () => {
    if (selectedPlayers.length < 2) {
      toast({
        title: "שגיאה",
        description: "יש לבחור לפחות 2 שחקנים",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/leagues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          players: selectedPlayers,
          rounds: numRounds,
        }),
      })

      if (!response.ok) throw new Error("Failed to create league")

      const data = await response.json()
      toast({
        title: "הליגה נוצרה בהצלחה",
        description: `נוצרו ${data.matches.length} משחקים`,
        variant: "default",
      })

      // רענון הדף
      window.location.reload()
    } catch (error) {
      console.error("Error creating league:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה ביצירת הליגה",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  return (
    <Card className="border-2 border-blue-200 shadow-md">
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-100 to-blue-50">
        <CardTitle className="text-blue-800">יצירת ליגה חדשה</CardTitle>
        <CardDescription className="text-blue-600">בחר שחקנים והגדר את מספר הסיבובים</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>מספר סיבובים</Label>
          <div className="flex gap-2">
            <Button
              variant={numRounds === 1 ? "default" : "outline"}
              onClick={() => setNumRounds(1)}
              className="flex-1"
            >
              סיבוב אחד
            </Button>
            <Button
              variant={numRounds === 2 ? "default" : "outline"}
              onClick={() => setNumRounds(2)}
              className="flex-1"
            >
              שני סיבובים
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>בחירת שחקנים</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {players.map(player => (
              <Button
                key={player.id}
                variant={selectedPlayers.includes(player.id) ? "default" : "outline"}
                onClick={() => togglePlayer(player.id)}
                className="justify-start gap-2"
              >
                <span>{player.name}</span>
                <span className="text-sm opacity-70">({player.rating})</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            onClick={handleCreateLeague}
            disabled={isCreating || selectedPlayers.length < 2}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCreating ? "יוצר ליגה..." : "צור ליגה"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 