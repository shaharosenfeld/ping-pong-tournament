import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getAuthHeaders } from '@/lib/admin-utils'
import { CheckCircle, XCircle, DollarSign } from 'lucide-react'

interface Registration {
  id: string
  name: string
  email: string
  phone: string
  paymentStatus: string
  paymentMethod: string
  isApproved: boolean
  createdAt: string
  player: {
    id: string
    name: string
    rating: number
  } | null
}

interface TournamentRegistrationsProps {
  tournamentId: string
  isAdmin: boolean
  onRegistrationsChange?: () => void
}

export function TournamentRegistrations({ tournamentId, isAdmin, onRegistrationsChange }: TournamentRegistrationsProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const loadRegistrations = async () => {
    try {
      setIsLoading(true)
      const headers = isAdmin ? getAuthHeaders() : undefined
      
      const response = await fetch(`/api/tournaments/${tournamentId}/registrations`, {
        headers: headers instanceof Headers ? 
          Object.fromEntries([...headers.entries()]) : 
          headers
      })

      if (!response.ok) {
        throw new Error('Failed to load registrations')
      }

      const data = await response.json()
      setRegistrations(data.registrations || [])
    } catch (error) {
      console.error('Error loading registrations:', error)
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת הרישומים',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const closeRegistration = async () => {
    if (!confirm('האם אתה בטוח שברצונך לסגור את ההרשמה ולהגריל משחקים?')) {
      return
    }

    try {
      setIsLoading(true)
      const headers = getAuthHeaders()
      
      const response = await fetch(`/api/tournaments/${tournamentId}/close-registration`, {
        method: 'POST',
        headers: headers instanceof Headers ? 
          Object.fromEntries([...headers.entries()]) : 
          headers
      })

      if (!response.ok) {
        throw new Error('Failed to close registration')
      }

      const data = await response.json()
      
      toast({
        title: 'הצלחה',
        description: 'ההרשמה נסגרה והמשחקים נוצרו בהצלחה',
      })

      if (onRegistrationsChange) {
        onRegistrationsChange()
      }
    } catch (error) {
      console.error('Error closing registration:', error)
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בסגירת ההרשמה',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateApprovalStatus = async (registrationId: string, isApproved: boolean) => {
    try {
      const headers = getAuthHeaders()
      
      const response = await fetch(`/api/tournaments/${tournamentId}/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(headers instanceof Headers ? 
            Object.fromEntries([...headers.entries()]) : 
            headers)
        },
        body: JSON.stringify({ isApproved })
      })

      if (!response.ok) {
        throw new Error(`Failed to update registration status: ${response.statusText}`)
      }

      toast({
        title: 'הצלחה',
        description: `הרישום ${isApproved ? 'אושר' : 'בוטל'} בהצלחה`,
      })

      // עדכון מקומי של הרשימה
      setRegistrations(prev =>
        prev.map(reg => 
          reg.id === registrationId ? { ...reg, isApproved } : reg
        )
      )

      if (onRegistrationsChange) {
        onRegistrationsChange()
      }
    } catch (error) {
      console.error('Error updating registration:', error)
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בעדכון סטטוס הרישום',
        variant: 'destructive',
      })
    }
  }

  const updatePaymentStatus = async (registrationId: string, paymentStatus: string) => {
    try {
      const headers = getAuthHeaders()
      
      const response = await fetch(`/api/tournaments/${tournamentId}/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(headers instanceof Headers ? 
            Object.fromEntries([...headers.entries()]) : 
            headers)
        },
        body: JSON.stringify({ paymentStatus })
      })

      if (!response.ok) {
        throw new Error(`Failed to update payment status: ${response.statusText}`)
      }

      toast({
        title: 'הצלחה',
        description: `סטטוס התשלום עודכן ל${paymentStatus === 'paid' ? 'שולם' : 'לא שולם'} בהצלחה`,
      })

      // עדכון מקומי של הרשימה
      setRegistrations(prev =>
        prev.map(reg => 
          reg.id === registrationId ? { ...reg, paymentStatus } : reg
        )
      )

      if (onRegistrationsChange) {
        onRegistrationsChange()
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בעדכון סטטוס התשלום',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadRegistrations()
  }, [tournamentId])

  if (isLoading) {
    return <div className="text-center p-4">טוען רישומים...</div>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>רשימת נרשמים</CardTitle>
        <CardDescription>
          {registrations.length} נרשמים
          {isAdmin && (
            <Button 
              onClick={closeRegistration} 
              className="mt-2"
              variant="outline"
              size="sm"
            >
              סגור הרשמה והגרל משחקים
            </Button>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {registrations.length === 0 ? (
          <div className="text-center text-muted-foreground">
            אין נרשמים לטורניר זה עדיין
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map(registration => (
              <div key={registration.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <div className="font-medium">{registration.name}</div>
                  <div className="text-sm text-muted-foreground">{registration.email}</div>
                  {registration.phone && (
                    <div className="text-sm text-muted-foreground">{registration.phone}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={registration.paymentStatus === 'paid' ? 'default' : 'outline'}>
                    {registration.paymentStatus === 'paid' ? 'שולם' : 'לא שולם'}
                  </Badge>
                  <Badge variant={registration.isApproved ? 'default' : 'outline'}>
                    {registration.isApproved ? 'מאושר' : 'ממתין לאישור'}
                  </Badge>
                  {isAdmin && (
                    <div className="flex gap-1">
                      {!registration.isApproved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateApprovalStatus(registration.id, true)}
                          title="אשר הרשמה"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {registration.isApproved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateApprovalStatus(registration.id, false)}
                          title="בטל אישור"
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                      {registration.paymentStatus !== 'paid' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updatePaymentStatus(registration.id, 'paid')}
                          title="סמן כשולם"
                        >
                          <DollarSign className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      {registration.paymentStatus === 'paid' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updatePaymentStatus(registration.id, 'pending')}
                          title="בטל סימון תשלום"
                        >
                          <DollarSign className="h-4 w-4 text-gray-400" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 