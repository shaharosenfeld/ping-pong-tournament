"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react"

// Mock data for players and tournaments
const PLAYERS = [
  { id: "1", name: "אלכס ג'ונסון", level: 5 },
  { id: "2", name: "סם וילסון", level: 4 },
  { id: "3", name: "ג'יימי סמית'", level: 3 },
  { id: "4", name: "טיילור ריד", level: 2 },
  { id: "5", name: "מורגן לי", level: 3 },
  { id: "6", name: "ריילי צ'ן", level: 4 },
]

const TOURNAMENTS = [
  { id: "1", name: "אליפות המשרד" },
  { id: "2", name: "טורניר יום שישי" },
  { id: "3", name: "אתגר חודשי" },
]

export default function NewMatchPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    tournamentId: "",
    player1Id: "",
    player2Id: "",
    date: "",
    time: "",
    round: "",
    location: "",
    notes: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would save the match data to your database
    console.log("Match data:", formData)

    // Redirect to the matches page
    router.push("/matches")
  }

  // Get player by ID
  const getPlayer = (id: string) => PLAYERS.find((player) => player.id === id)

  // Check if players are of similar level (for recommendation)
  const areSimilarLevel = () => {
    if (!formData.player1Id || !formData.player2Id) return true

    const player1 = getPlayer(formData.player1Id)
    const player2 = getPlayer(formData.player2Id)

    if (!player1 || !player2) return true

    return Math.abs(player1.level - player2.level) <= 1
  }

  return (
    <div dir="rtl" className="container mx-auto py-6 max-w-2xl bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/matches">
          <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-100">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-blue-700">צור משחק חדש</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
            <CardTitle className="text-blue-800">פרטי המשחק</CardTitle>
            <CardDescription className="text-blue-600">מלא את הפרטים עבור המשחק החדש</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-2">
              <Label htmlFor="tournamentId" className="text-blue-700">
                טורניר
              </Label>
              <Select
                value={formData.tournamentId}
                onValueChange={(value) => handleSelectChange("tournamentId", value)}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="בחר טורניר" />
                </SelectTrigger>
                <SelectContent>
                  {TOURNAMENTS.map((tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                    {PLAYERS.map((player) => (
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
                  <SelectTrigger
                    className={`border-blue-200 focus:border-blue-400 ${
                      formData.player1Id && formData.player2Id && !areSimilarLevel()
                        ? "border-yellow-400 bg-yellow-50"
                        : ""
                    }`}
                  >
                    <SelectValue placeholder="בחר שחקן" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYERS.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} {Array(player.level).fill("★").join("")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.player1Id && formData.player2Id && !areSimilarLevel() && (
                  <p className="text-xs text-yellow-600">שים לב: רמת השחקנים שונה משמעותית</p>
                )}
              </div>
            </div>

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
                  <SelectItem value="league">משחק ליגה</SelectItem>
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

            <div className="space-y-2">
              <Label htmlFor="location" className="text-blue-700">
                מיקום
              </Label>
              <div className="relative">
                <MapPin className="absolute right-2.5 top-2.5 h-4 w-4 text-blue-400" />
                <Input
                  id="location"
                  name="location"
                  placeholder="הזן את מיקום המשחק"
                  value={formData.location}
                  onChange={handleChange}
                  className="pr-8 border-blue-200 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-blue-700">
                הערות
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="הערות נוספות לגבי המשחק"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between bg-blue-50">
            <Link href="/matches">
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                ביטול
              </Button>
            </Link>
            <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white">
              צור משחק
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

