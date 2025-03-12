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
}

export default function EditTournamentPage() {
  const router = useRouter()
  const pathname = usePathname()
  // Extract the ID from pathname
  const tournamentId = pathname.split('/').slice(-2)[0] || ''
  
  const { toast } = useToast()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
        const response = await fetch(`/api/tournaments/${tournamentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        })
        
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
        toast({
          title: "שגיאה בטעינת נתונים",
          description: "לא ניתן לטעון את פרטי הטורניר",
          variant: "destructive",
        })
        router.push('/tournaments')
      }
    }

    fetchTournament()
  }, [tournamentId, router, toast])

  const handleSuccess = () => {
    toast({
      title: "הטורניר עודכן בהצלחה",
      description: "פרטי הטורניר עודכנו במערכת",
      variant: "default",
    })
    router.push(`/tournaments/${tournamentId}`)
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
              registrationDeadline: tournament.registrationDeadline || ""
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