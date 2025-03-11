"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getImageUrl } from "@/lib/utils"

interface Player {
  id: string
  name: string
  avatar?: string
  initials?: string
  level: number
  wins: number
  losses: number
  winRate: number
}

interface Match {
  id: string
  date: string
  status: string
  player1: Player
  player2: Player
  tournament: {
    id: string
    name: string
    format: string
  }
  player1Score?: number
  player2Score?: number
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchMatches() {
      try {
        const response = await fetch('/api/matches')
        if (!response.ok) throw new Error('Failed to load matches')
        const data = await response.json()
        setMatches(data)
      } catch (error) {
        console.error('Error fetching matches:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMatches()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center text-muted-foreground">טוען...</div>
      </div>
    )
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'מתוכנן'
      case 'in_progress':
        return 'בתהליך'
      case 'completed':
        return 'הסתיים'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default'
      case 'in_progress':
        return 'warning'
      case 'completed':
        return 'success'
      default:
        return 'default'
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">משחקים</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => (
          <Card key={match.id} className="overflow-hidden">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{match.tournament.name}</CardTitle>
                </div>
                <Badge variant={getStatusColor(match.status) as any}>
                  {getStatusText(match.status)}
                </Badge>
              </div>
              <CardDescription>
                {new Date(match.date).toLocaleDateString('he-IL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-blue-100">
                    {match.player1.avatar ? (
                      <div className="h-full w-full overflow-hidden rounded-full">
                        <img 
                          src={getImageUrl(match.player1.avatar)} 
                          alt={match.player1.name} 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.log('Error loading player1 image in matches page');
                            (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                          }}
                        />
                      </div>
                    ) : (
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {match.player1.name.slice(0, 2)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-medium">{match.player1.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {match.player1.wins}נ - {match.player1.losses}ה
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {match.player1Score} - {match.player2Score}
                  </div>
                  <div className="text-sm text-muted-foreground">{match.status === 'completed' ? 'משתתף' : 'לא סומן'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-medium">{match.player2.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {match.player2.wins}נ - {match.player2.losses}ה
                    </div>
                  </div>
                  <Avatar className="h-10 w-10 border border-blue-100">
                    {match.player2.avatar ? (
                      <div className="h-full w-full overflow-hidden rounded-full">
                        <img 
                          src={getImageUrl(match.player2.avatar)} 
                          alt={match.player2.name} 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.log('Error loading player2 image in matches page');
                            (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                          }}
                        />
                      </div>
                    ) : (
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {match.player2.name.slice(0, 2)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Link href={`/matches/${match.id}`}>
                  <Button variant="outline" size="sm">
                    פרטים נוספים
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

