"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import AdminCheck from "@/components/admin-check"
import { TournamentForm } from "@/components/TournamentForm"

interface Tournament {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  format: string
  maxPlayers: number
  rounds: number
  status: string
  location?: string
  players: { id: string }[]
  price: number | null
  firstPlacePrize: string | null
  secondPlacePrize: string | null
  registrationOpen: boolean
  registrationDeadline: string | null
  bitPaymentPhone: string | null
  bitPaymentName: string | null
  payboxPaymentLink: string | null
}

export default function EditTournamentPage() {
  const router = useRouter()
  const pathname = usePathname()
  // Extract the ID from pathname
  const tournamentId = pathname.split('/').slice(-2)[0] || ''
  
  const { toast } = useToast()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState(false)

  useEffect(() => {
    const fetchTournament = async () => {
      if (!tournamentId) {
        toast({
          title: "שגיאה",
          description: "מזהה טורניר חסר",
          variant: "destructive",
        })
        router.push('/tournaments')
        return
      }
      
      try {
        console.log(`Fetching tournament data for ID: ${tournamentId}`)
        
        // Get admin token from localStorage
        const adminToken = localStorage.getItem('adminToken')
        if (!adminToken) {
          setAuthError(true)
          throw new Error('Admin token missing')
        }
        
        const response = await fetch(`/api/tournaments/${tournamentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
            'X-Admin-Token': adminToken,
            'Cache-Control': 'no-cache'
          }
        })
        
        if (response.status === 401) {
          setAuthError(true)
          throw new Error('Unauthorized')
        }
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`API Error: ${response.status} - ${errorText}`)
          throw new Error(`Failed to fetch tournament: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('Tournament data retrieved:', data)
        setTournament(data.tournament || data)
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching tournament:', error)
        
        if (authError) {
          toast({
            title: "שגיאת הרשאות",
            description: "אין לך הרשאה לעריכת טורניר. נא להתחבר מחדש.",
            variant: "destructive",
          })
          
          // Redirect to login after a short delay
          setTimeout(() => {
            router.push('/login?returnTo=' + encodeURIComponent(window.location.pathname))
          }, 2000)
        } else {
          toast({
            title: "שגיאה בטעינת נתונים",
            description: "לא ניתן לטעון את פרטי הטורניר",
            variant: "destructive",
          })
          router.push('/tournaments')
        }
      }
    }

    fetchTournament()
  }, [tournamentId, router, toast, authError])

  const handleSuccess = () => {
    toast({
      title: "הטורניר עודכן בהצלחה",
      description: "פרטי הטורניר עודכנו במערכת",
      variant: "default",
    })
    router.push(`/tournaments/${tournamentId}`)
  }

  if (authError) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">שגיאת הרשאות</h1>
          <p>אין לך הרשאה לעריכת טורניר. מועבר לדף התחברות...</p>
          <Button onClick={() => router.push('/login?returnTo=' + encodeURIComponent(window.location.pathname))}>
            התחבר
          </Button>
        </div>
      </div>
    )
  }

  return (
    <AdminCheck>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href={`/tournaments/${tournamentId}`}>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">עריכת טורניר</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tournament ? (
          <TournamentForm 
            mode="edit"
            tournamentId={tournamentId}
            initialData={{
              name: tournament.name,
              description: tournament.description || "",
              startDate: tournament.startDate,
              endDate: tournament.endDate || "",
              format: tournament.format,
              maxPlayers: tournament.maxPlayers.toString(),
              rounds: tournament.rounds.toString(),
              status: tournament.status,
              location: tournament.location || "",
              price: tournament.price?.toString() || "",
              firstPlacePrize: tournament.firstPlacePrize || "",
              secondPlacePrize: tournament.secondPlacePrize || "",
              players: tournament.players.map(p => p.id),
              registrationOpen: tournament.registrationOpen || false,
              registrationDeadline: tournament.registrationDeadline || "",
              bitPaymentPhone: tournament.bitPaymentPhone || "",
              bitPaymentName: tournament.bitPaymentName || "",
              payboxPaymentLink: tournament.payboxPaymentLink || ""
            }}
            onSuccess={handleSuccess}
          />
        ) : (
          <div className="text-center text-muted-foreground py-12">
            לא נמצא טורניר
          </div>
        )}
      </div>
    </AdminCheck>
  )
} 