"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus, ArrowLeft, RefreshCw, Download } from "lucide-react"
import { PlayersList } from "@/components/players-list"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/app/hooks/use-auth"

interface Player {
  id: string
  name: string
  avatar?: string
  initials: string
  wins: number
  losses: number
  level: number
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useAuth()
  const [recalculating, setRecalculating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/players')
        const data = await response.json()
        setPlayers(data)
      } catch (error) {
        console.error('Error fetching players:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()
  }, [])

  const handleRecalculateStats = async () => {
    if (!confirm('האם אתה בטוח שברצונך לחשב מחדש את כל סטטיסטיקות השחקנים? פעולה זו עשויה לקחת זמן.')) {
      return;
    }
    
    setRecalculating(true);
    try {
      // קריאה ל-API לחישוב מחדש של כל הסטטיסטיקות
      const response = await fetch('/api/players/recalculate-all', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to recalculate player statistics');
      }
      
      // עדכון רמות השחקנים לפי שיטת האחוזונים החדשה
      const levelResponse = await fetch('/api/players/recalculate-levels', {
        method: 'POST',
      });
      
      if (!levelResponse.ok) {
        throw new Error('Failed to recalculate player levels');
      }
      
      toast({
        title: "הצלחה",
        description: "סטטיסטיקות ורמות השחקנים חושבו מחדש בהצלחה",
      });
      
      // רענון הדף
      window.location.reload();
    } catch (error) {
      console.error('Error recalculating player stats:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בחישוב מחדש של סטטיסטיקות השחקנים",
        variant: "destructive",
      });
    } finally {
      setRecalculating(false);
    }
  };

  const handleResetAndRecalculate = async () => {
    if (!confirm('אזהרה: פעולה זו תאפס לחלוטין את כל נתוני השחקנים (ניצחונות, הפסדים, דירוג ורמה) ותחשב אותם מחדש. האם אתה בטוח שברצונך להמשיך?')) {
      return;
    }
    
    setRecalculating(true);
    try {
      // קריאה ל-API לאיפוס וחישוב מחדש
      const response = await fetch('/api/players/reset-and-recalculate', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset and recalculate player statistics');
      }
      
      toast({
        title: "הצלחה",
        description: "כל נתוני השחקנים אופסו וחושבו מחדש בהצלחה",
      });
      
      // רענון הדף
      window.location.reload();
    } catch (error) {
      console.error('Error resetting and recalculating player stats:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה באיפוס וחישוב מחדש של נתוני השחקנים",
        variant: "destructive",
      });
    } finally {
      setRecalculating(false);
    }
  };

  const handleExportData = async () => {
    try {
      // פתיחת הנתונים בחלון חדש או הורדה ישירה
      window.open('/api/players/export', '_blank');
    } catch (error) {
      console.error('Error exporting player data:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בייצוא נתוני השחקנים",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center text-muted-foreground">טוען...</div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">שחקנים</h1>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleRecalculateStats}
                  disabled={recalculating}
                >
                  {recalculating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      מחשב...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      חישוב מחדש
                    </>
                  )}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleResetAndRecalculate}
                  disabled={recalculating}
                >
                  {recalculating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      מאפס...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      איפוס וחישוב
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleExportData}
                >
                  <Download className="mr-2 h-4 w-4" />
                  ייצוא נתונים
                </Button>
                <Link href="/players/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    שחקן חדש
                  </Button>
                </Link>
              </>
            )}
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                חזרה
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>רשימת השחקנים</CardTitle>
                <CardDescription>כל השחקנים הרשומים במערכת</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PlayersList players={players} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

