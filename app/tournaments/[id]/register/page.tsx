"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast" 
import { Trophy, ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import PaymentMethodSelector from "@/components/PaymentMethodSelector"

export default function TournamentRegisterPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [tournament, setTournament] = useState<any>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [registration, setRegistration] = useState<any>(null)

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setIsLoading(true)
        const tournamentResponse = await fetch(`/api/tournaments/${params.id}`)
        const playersResponse = await fetch('/api/players')
        
        if (!tournamentResponse.ok) {
          toast({
            title: "שגיאה",
            description: "אירעה שגיאה בטעינת נתוני הטורניר",
            variant: "destructive",
          })
          return
        }
        
        const tournamentData = await tournamentResponse.json()
        
        // אם ההרשמה לטורניר סגורה, חזור לדף הטורניר
        if (!tournamentData.registrationOpen) {
          toast({
            title: "ההרשמה סגורה",
            description: "ההרשמה לטורניר זה סגורה",
            variant: "destructive",
          })
          router.push(`/tournaments/${params.id}`)
          return
        }
        
        const playersData = await playersResponse.json()
        
        setTournament(tournamentData)
        setPlayers(playersData)
      } catch (error) {
        console.error("Error fetching tournament data:", error)
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בטעינת נתוני הטורניר",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTournament()
  }, [params.id, router, toast])
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPlayer) {
      toast({
        title: "שגיאה",
        description: "נא לבחור שחקן",
        variant: "destructive",
      })
      return
    }
    
    if (!email) {
      toast({
        title: "שגיאה",
        description: "נא להזין כתובת אימייל",
        variant: "destructive",
      })
      return
    }
    
    if (!name) {
      toast({
        title: "שגיאה",
        description: "נא להזין שם",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsProcessing(true)
      
      // שמור את פרטי ההרשמה במערכת
      const response = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId: params.id,
          playerId: selectedPlayer,
          email,
          name,
          phone,
          paymentMethod: null // נאפשר לבחור אמצעי תשלום בשלב הבא
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "אירעה שגיאה בתהליך ההרשמה")
      }
      
      const data = await response.json()
      
      // שמור את פרטי ההרשמה לשימוש אמצעי התשלום
      setRegistration(data.registration)
      
      // הצג את טופס התשלום
      setShowPaymentForm(true)
      
      toast({
        title: "ההרשמה בוצעה בהצלחה",
        description: "כעת ניתן לבחור אמצעי תשלום",
      })
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "שגיאה",
        description: error instanceof Error ? error.message : "אירעה שגיאה בתהליך ההרשמה",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handlePaymentSuccess = () => {
    toast({
      title: "התשלום בוצע בהצלחה",
      description: "ההרשמה לטורניר הושלמה. אישור יישלח לדוא״ל שלך.",
    })
    
    // המתן רגע ואז חזור לדף הטורניר
    setTimeout(() => {
      router.push(`/tournaments/${params.id}`)
    }, 1500)
  }
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
        <p className="text-blue-600">טוען נתוני טורניר...</p>
      </div>
    )
  }
  
  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700 mb-2">הטורניר לא נמצא</h2>
        <p className="text-gray-600 mb-6">לא ניתן למצוא את הטורניר המבוקש</p>
        <Link href="/tournaments">
          <Button variant="outline">חזרה לרשימת הטורנירים</Button>
        </Link>
      </div>
    )
  }
  
  if (!tournament.registrationOpen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-yellow-700 mb-2">ההרשמה סגורה</h2>
        <p className="text-gray-600 mb-6">ההרשמה לטורניר זה סגורה כרגע</p>
        <Link href={`/tournaments/${params.id}`}>
          <Button variant="outline">חזרה לדף הטורניר</Button>
        </Link>
      </div>
    )
  }
  
  if (!tournament.price) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-yellow-700 mb-2">לא נדרש תשלום</h2>
        <p className="text-gray-600 mb-6">לטורניר זה אין דמי השתתפות</p>
        <Link href={`/tournaments/${params.id}`}>
          <Button variant="outline">חזרה לדף הטורניר</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl" dir="rtl">
      <Link href={`/tournaments/${params.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft className="h-4 w-4" />
        <span>חזרה לדף הטורניר</span>
      </Link>
      
      <Card className="border-2 border-blue-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white rounded-full shadow-sm">
              <Trophy className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl text-blue-800">
              {showPaymentForm ? "תשלום עבור הטורניר" : "הרשמה לטורניר"}
            </CardTitle>
          </div>
          <CardDescription>
            {tournament.name}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          {showPaymentForm && registration ? (
            <PaymentMethodSelector
              registrationId={registration.id}
              tournamentId={params.id}
              amount={tournament.price || 0}
              bitPaymentPhone={tournament.bitPaymentPhone}
              bitPaymentName={tournament.bitPaymentName}
              payboxPaymentLink={tournament.payboxPaymentLink}
              onSuccess={handlePaymentSuccess}
            />
          ) : (
            <form onSubmit={handleRegister}>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="player">בחר שחקן</Label>
                  <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                    <SelectTrigger id="player">
                      <SelectValue placeholder="בחר שחקן עבורו אתה משלם" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">שם מלא</Label>
                  <Input 
                    id="name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="הזן את שמך המלא"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">אימייל</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="הזן את כתובת האימייל שלך"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    אישור תשלום ועדכונים יישלחו לכתובת זו
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון (אופציונלי)</Label>
                  <Input 
                    id="phone" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="הזן את מספר הטלפון שלך"
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="font-semibold text-blue-800 mb-2">פרטי תשלום</h3>
                  <p className="text-sm">
                    דמי השתתפות: <span className="font-semibold">{tournament.price} ₪</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    בשלב הבא תוכל לבחור את אמצעי התשלום המועדף עליך
                  </p>
                </div>
              </div>
              
              <Button 
                type="submit"
                className="w-full mt-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>מעבד...</span>
                  </div>
                ) : (
                  <span>המשך לתשלום</span>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 