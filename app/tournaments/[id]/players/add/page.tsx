"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Search, Users } from "lucide-react"
import { getTournament, getPlayers, addPlayersToTournament } from "@/lib/db"
import { toast } from "sonner"

interface Player {
  id: string
  name: string
  email: string | null
  phone: string | null
  level: number
  createdAt: Date
  updatedAt: Date
}

interface Tournament {
  id: string
  name: string
  description: string | null
  startDate: Date
  endDate: Date | null
  status: string
  format: string
  maxPlayers: number
  players: Player[]
  matches: any[]
  createdAt: Date
  updatedAt: Date
}

export default function AddPlayersToTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  
  const router = useRouter()
  const tournamentId = unwrappedParams.id
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [players, setPlayers] = useState<(Player & { selected: boolean })[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [tournamentId])

  const loadData = async () => {
    try {
      const [tournamentData, playersData] = await Promise.all([
        getTournament(tournamentId),
        getPlayers()
      ])
      setTournament(tournamentData)
      setPlayers(playersData.map((player: Player) => ({
        ...player,
        selected: tournamentData.players.some((p: Player) => p.id === player.id)
      })))
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error("שגיאה בטעינת הנתונים")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayerToggle = (playerId: string) => {
    if (!tournament) return

    const selectedCount = players.filter(p => p.selected || p.id === playerId).length
    const isSelecting = !players.find(p => p.id === playerId)?.selected

    if (isSelecting && selectedCount > tournament.maxPlayers) {
      toast.error(`לא ניתן להוסיף יותר מ-${tournament.maxPlayers} שחקנים`)
      return
    }

    setPlayers(players.map(player => 
      player.id === playerId ? { ...player, selected: !player.selected } : player
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tournament) return

    const selectedPlayers = players.filter(player => player.selected)

    if (selectedPlayers.length === 0) {
      toast.error("נא לבחור לפחות שחקן אחד")
      return
    }

    if (selectedPlayers.length > tournament.maxPlayers) {
      toast.error(`לא ניתן להוסיף יותר מ-${tournament.maxPlayers} שחקנים`)
      return
    }

    setIsSubmitting(true)

    try {
      await addPlayersToTournament(tournamentId, selectedPlayers.map(player => player.id))
      toast.success("השחקנים נוספו בהצלחה")
      router.push(`/tournaments/${tournamentId}`)
    } catch (error) {
      console.error('Error adding players:', error)
      toast.error("שגיאה בהוספת השחקנים")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return <div className="text-center py-8">טוען נתונים...</div>
  }

  if (!tournament) {
    return <div className="text-center py-8 text-red-500">הטורניר לא נמצא</div>
  }

  const selectedCount = players.filter(p => p.selected).length

  return (
    <div dir="rtl" className="container mx-auto py-6 max-w-2xl bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/tournaments/${tournamentId}`}>
          <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-100">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-blue-700">הוסף שחקנים ל{tournament.name}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
            <CardTitle className="text-blue-800">בחר שחקנים</CardTitle>
            <CardDescription className="text-blue-600">
              בחר עד {tournament.maxPlayers} שחקנים להוספה לטורניר • נבחרו {selectedCount} שחקנים
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="relative">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-blue-400" />
              <Input
                type="search"
                placeholder="חפש שחקנים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8 border-blue-200 focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    player.selected ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={player.selected}
                      onCheckedChange={() => handlePlayerToggle(player.id)}
                      disabled={!player.selected && selectedCount >= tournament.maxPlayers}
                    />
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <span>רמה:</span>
                        <span className="text-yellow-500">{Array(player.level).fill("★").join("")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredPlayers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  לא נמצאו שחקנים
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between bg-blue-50">
            <Link href={`/tournaments/${tournamentId}`}>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                ביטול
              </Button>
            </Link>
            <Button 
              type="submit" 
              className="bg-green-500 hover:bg-green-600 text-white"
              disabled={isSubmitting || selectedCount === 0}
            >
              {isSubmitting ? "מוסיף שחקנים..." : "הוסף שחקנים"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

