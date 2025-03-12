"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, CheckCircle2, CreditCard, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getImageUrl } from "@/lib/utils"

interface Player {
  id: string
  name: string
  avatar: string | null
  initials: string
}

interface Tournament {
  id: string
  name: string
  startDate: string
  price: number | null
  registrationOpen: boolean
  registrationDeadline: string | null
}

interface TournamentRegistrationProps {
  tournament: Tournament
  onRegistrationComplete?: () => void
}

export function TournamentRegistration({ tournament, onRegistrationComplete }: TournamentRegistrationProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    playerId: "",
  })
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Load players for selection
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/players')
        if (!response.ok) {
          throw new Error('Failed to load players')
        }
        const data = await response.json()
        setPlayers(data)
      } catch (error) {
        console.error('Error loading players:', error)
        toast({
          title: "שגיאה",
          description: "לא ניתן לטעון את רשימת השחקנים",
          variant: "destructive",
        })
      }
    }

    fetchPlayers()
  }, [toast])

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle player selection
  const handlePlayerSelect = (playerId: string) => {
    setFormData(prev => ({ ...prev, playerId }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    
    if (!formData.name || !formData.email || !formData.playerId) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות הנדרשים",
        variant: "destructive",
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId: tournament.id,
          playerId: formData.playerId,
          userEmail: formData.email,
          userName: formData.name,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'אירעה שגיאה בתהליך ההרשמה')
      }
      
      const data = await response.json()
      
      // Registration successful
      toast({
        title: "הרשמה בוצעה בהצלחה",
        description: "נרשמת בהצלחה לטורניר. פרטים יישלחו לכתובת האימייל שלך.",
        variant: "default",
      })
      
      setRegistrationComplete(true)
      
      if (onRegistrationComplete) {
        onRegistrationComplete()
      }
    } catch (error) {
      console.error('Error registering for tournament:', error)
      toast({
        title: "שגיאה",
        description: error instanceof Error ? error.message : "אירעה שגיאה בתהליך ההרשמה",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setDialogOpen(false)
    }
  }
  
  // If tournament is not open for registration, show message
  if (!tournament.registrationOpen) {
    return (
      <Card className="border-2 border-red-100">
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            הרשמה סגורה
          </CardTitle>
          <CardDescription className="text-red-600">
            ההרשמה לטורניר זה סגורה כרגע
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  // If registration is complete, show success message
  if (registrationComplete) {
    return (
      <Card className="border-2 border-green-100">
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            ההרשמה הושלמה בהצלחה
          </CardTitle>
          <CardDescription className="text-green-600">
            נרשמת בהצלחה לטורניר. פרטים נשלחו לכתובת האימייל שלך.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-blue-100">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Trophy className="h-5 w-5" />
          הרשמה לטורניר
        </CardTitle>
        <CardDescription className="text-blue-600">
          {tournament.name} | {new Date(tournament.startDate).toLocaleDateString('he-IL')}
          {tournament.price ? ` | ${tournament.price} ₪` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              הירשם עכשיו
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>הרשמה לטורניר</DialogTitle>
              <DialogDescription>
                הזן את פרטיך להרשמה לטורניר {tournament.name}
                {tournament.price ? ` (${tournament.price} ₪)` : ''}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">שם מלא</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="הזן את שמך המלא"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="הזן את כתובת האימייל שלך"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>בחר שחקן</Label>
                <Select value={formData.playerId} onValueChange={handlePlayerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר שחקן" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map(player => (
                      <SelectItem key={player.id} value={player.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {player.avatar ? (
                              <AvatarImage src={getImageUrl(player.avatar)} alt={player.name} />
                            ) : (
                              <AvatarFallback>{player.initials}</AvatarFallback>
                            )}
                          </Avatar>
                          <span>{player.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {tournament.price && tournament.price > 0 && (
                <div className="rounded-md bg-blue-50 p-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-700">פרטי תשלום</h4>
                      <p className="text-sm text-blue-600">לאחר אישור ההרשמה תועבר למסך התשלום</p>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter className="gap-2 sm:justify-start">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "מעבד..." : "אישור והמשך לתשלום"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  ביטול
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 