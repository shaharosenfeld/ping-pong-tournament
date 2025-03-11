"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, Clock } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/app/hooks/use-auth"
import { getAuthHeaders } from "@/lib/admin-utils"

interface Player {
  id: string
  name: string
  email: string | null
  phone: string | null
  level: number
}

interface Tournament {
  id: string
  name: string
  players: Player[]
}

export default function NewTournamentMatchPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  
  const router = useRouter()
  const { isAdmin } = useAuth()
  const tournamentId = unwrappedParams.id
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    tournamentId,
    player1Id: "",
    player2Id: "",
    date: "",
    time: "",
    round: "",
  })

  useEffect(() => {
    const loadTournament = async () => {
      try {
        const response = await fetch(`/api/tournaments/${tournamentId}`)
        if (!response.ok) throw new Error('Failed to load tournament')
        const data = await response.json()
        setTournament(data)
      } catch (error) {
        console.error('Error loading tournament:', error)
        toast.error("שגיאה בטעינת נתוני הטורניר")
      } finally {
        setLoading(false)
      }
    }

    loadTournament()
  }, [tournamentId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // בדיקת הרשאות מנהל
    if (!isAdmin) {
      toast.error("אין לך הרשאות מנהל ליצירת משחק חדש")
      return
    }
    
    // Validate required fields
    if (!formData.player1Id || !formData.player2Id || !formData.date || !formData.time || !formData.round) {
      toast.error("נא למלא את כל שדות החובה")
      return
    }

    // Validate that player1 and player2 are different
    if (formData.player1Id === formData.player2Id) {
      toast.error("לא ניתן לבחור את אותו שחקן פעמיים")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          tournamentId: formData.tournamentId,
          player1Id: formData.player1Id,
          player2Id: formData.player2Id,
          date: new Date(`${formData.date}T${formData.time}`),
          round: formData.round,
          status: 'scheduled'
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create match')
      }

      toast.success("המשחק נוצר בהצלחה")
      router.push(`/tournaments/${tournamentId}`)
    } catch (error) {
      console.error('Error creating match:', error)
      toast.error(error instanceof Error ? error.message : 'שגיאה ביצירת המשחק')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get player by ID
  const getPlayer = (id: string) => tournament?.players.find((player) => player.id === id)

  // Check if players are of similar level (for recommendation)
  const areSimilarLevel = () => {
    if (!formData.player1Id || !formData.player2Id) return true

    const player1 = getPlayer(formData.player1Id)
    const player2 = getPlayer(formData.player2Id)

    if (!player1 || !player2) return true

    return Math.abs(player1.level - player2.level) <= 1
  }

  if (loading) {
    return <div className="text-center p-8">טוען...</div>
  }

  if (!tournament) {
    return <div className="text-center p-8">טורניר לא נמצא</div>
  }

  return (
    <div dir="rtl" className="container mx-auto py-6 max-w-2xl bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/tournaments/${tournamentId}`}>
          <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-100">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-blue-700">הוסף משחק ל{tournament.name}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
            <CardTitle className="text-blue-800">פרטי המשחק</CardTitle>
            <CardDescription className="text-blue-600">מלא את הפרטים עבור המשחק החדש בטורניר</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="player1Id" className="text-blue-700">
                  שחקן 1
                </Label>
                <Select value={formData.player1Id} onValueChange={(value) => handleSelectChange("player1Id", value)}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-400">
                    <SelectValue placeholder="בחר שחקן" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournament.players.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} {Array(player.level).fill("★").join("")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="player2Id" className="text-blue-700">
                  שחקן 2
                </Label>
                <Select value={formData.player2Id} onValueChange={(value) => handleSelectChange("player2Id", value)}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-400">
                    <SelectValue placeholder="בחר שחקן" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournament.players.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} {Array(player.level).fill("★").join("")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.player1Id && formData.player2Id && !areSimilarLevel() && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                <p>⚠️ שים לב: השחקנים שנבחרו הם ברמות שונות מדי. מומלץ לבחור שחקנים ברמה דומה.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="round" className="text-blue-700">
                שלב
              </Label>
              <Select value={formData.round} onValueChange={(value) => handleSelectChange("round", value)}>
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="בחר שלב" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">שלב הבתים</SelectItem>
                  <SelectItem value="round16">שמינית גמר</SelectItem>
                  <SelectItem value="quarter">רבע גמר</SelectItem>
                  <SelectItem value="semi">חצי גמר</SelectItem>
                  <SelectItem value="final">גמר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-blue-700">
                  תאריך
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="pl-8 border-blue-200 focus:border-blue-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-blue-700">
                  שעה
                </Label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="pl-8 border-blue-200 focus:border-blue-400"
                    required
                  />
                </div>
              </div>
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
              disabled={isSubmitting}
            >
              {isSubmitting ? "יוצר משחק..." : "צור משחק"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

