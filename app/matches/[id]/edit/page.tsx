"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, Calendar, Clock, Trophy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import AdminCheck from "@/components/admin-check"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getImageUrl } from "@/lib/utils"

interface Player {
  id: string
  name: string
  avatar?: string
  initials: string
}

interface Match {
  id: string
  player1: Player
  player2: Player
  player1Id: string
  player2Id: string
  player1Score?: number
  player2Score?: number
  tournamentId: string
  tournament: {
    name: string
  }
  date: string
  round: number
  status: string
}

export default function EditMatchPage() {
  const router = useRouter()
  const pathname = usePathname()
  // Extract the ID from pathname
  const matchId = pathname.split('/').slice(-2)[0] || ''
  
  const { toast } = useToast()
  const [match, setMatch] = useState<Match | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    player1Score: "",
    player2Score: "",
    date: "",
    status: "scheduled"
  })

  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchId) {
        toast({
          title: "שגיאה",
          description: "מזהה משחק חסר",
          variant: "destructive",
        })
        router.push('/matches')
        return
      }
      
      try {
        console.log(`Fetching match data for ID: ${matchId}`)
        const response = await fetch(`/api/matches/${matchId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`API Error: ${response.status} - ${errorText}`)
          throw new Error(`Failed to fetch match: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('Match data retrieved:', data)
        setMatch(data)
        
        setFormData({
          player1Score: data.player1Score?.toString() || "",
          player2Score: data.player2Score?.toString() || "",
          date: new Date(data.date).toISOString().split('T')[0],
          status: data.status || "scheduled"
        })
        
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching match:', error)
        toast({
          title: "שגיאה בטעינת נתונים",
          description: "לא ניתן לטעון את פרטי המשחק",
          variant: "destructive",
        })
        router.push('/matches')
      }
    }

    fetchMatch()
  }, [matchId, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving) return
    
    setIsSaving(true)
    
    try {
      console.log(`Updating match with ID: ${matchId}`)
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1Score: formData.player1Score ? parseInt(formData.player1Score) : null,
          player2Score: formData.player2Score ? parseInt(formData.player2Score) : null,
          date: new Date(formData.date).toISOString(),
          status: formData.status
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API Error: ${response.status} - ${errorText}`)
        throw new Error(`Failed to update match: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Match updated successfully:', data)
      
      toast({
        title: "המשחק עודכן בהצלחה",
        description: "פרטי המשחק עודכנו במערכת",
        variant: "default",
      })
      
      router.push(`/matches`)
    } catch (error) {
      console.error('Error updating match:', error)
      toast({
        title: "שגיאה בעדכון",
        description: `אירעה שגיאה בעדכון פרטי המשחק: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminCheck>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/matches">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">עריכת משחק</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : match ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>עריכת פרטי משחק</CardTitle>
              <CardDescription>עדכן את פרטי המשחק במערכת</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="font-medium">{match.tournament.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">סיבוב {match.round}</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10 border border-blue-100">
                        {match.player1.avatar ? (
                          <div className="h-full w-full overflow-hidden rounded-full">
                            <img 
                              src={getImageUrl(match.player1.avatar)} 
                              alt={match.player1.name} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                console.log('Error loading player1 image in match edit page');
                                (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                              }}
                            />
                          </div>
                        ) : (
                          <AvatarFallback>{match.player1.initials}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="font-medium">{match.player1.name}</div>
                    </div>
                    
                    <div className="text-xl mx-4">VS</div>
                    
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10 border border-blue-100">
                        {match.player2.avatar ? (
                          <div className="h-full w-full overflow-hidden rounded-full">
                            <img 
                              src={getImageUrl(match.player2.avatar)} 
                              alt={match.player2.name} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                console.log('Error loading player2 image in match edit page');
                                (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                              }}
                            />
                          </div>
                        ) : (
                          <AvatarFallback>{match.player2.initials}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="font-medium">{match.player2.name}</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="player1Score">ניקוד שחקן 1</Label>
                    <Input
                      id="player1Score"
                      name="player1Score"
                      type="number"
                      min="0"
                      value={formData.player1Score}
                      onChange={handleChange}
                      placeholder="ניקוד"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="player2Score">ניקוד שחקן 2</Label>
                    <Input
                      id="player2Score"
                      name="player2Score"
                      type="number"
                      min="0"
                      value={formData.player2Score}
                      onChange={handleChange}
                      placeholder="ניקוד"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">תאריך</Label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">סטטוס</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר סטטוס" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">מתוכנן</SelectItem>
                      <SelectItem value="in_progress">בתהליך</SelectItem>
                      <SelectItem value="completed">הסתיים</SelectItem>
                      <SelectItem value="cancelled">בוטל</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.push('/matches')}>
                  ביטול
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "שומר..." : "שמור שינויים"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            לא נמצא משחק
          </div>
        )}
      </div>
    </AdminCheck>
  )
}

