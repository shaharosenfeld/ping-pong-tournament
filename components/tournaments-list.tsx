"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, ArrowRight, ArrowLeft } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { AdminEditButton } from "./admin-edit-button"

interface Tournament {
  id: string
  name: string
  startDate: string
  endDate: string
  status: "upcoming" | "in_progress" | "completed"
  participantsCount: number
  type: "league" | "knockout" | "swiss"
}

export const TournamentsList = ({ tournaments }: { tournaments: Tournament[] }) => {
  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        אין טורנירים להצגה
      </div>
    )
  }

  const getStatusColor = (status: Tournament["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "in_progress":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: Tournament["status"]) => {
    switch (status) {
      case "completed":
        return "הסתיים"
      case "in_progress":
        return "בתהליך"
      default:
        return "מתוכנן"
    }
  }

  const getTournamentTypeText = (type: Tournament["type"]) => {
    switch (type) {
      case "league":
        return "ליגה"
      case "knockout":
        return "נוק-אאוט"
      case "swiss":
        return "שוויצרי"
      default:
        return type
    }
  }

  return (
    <div className="space-y-4">
      {tournaments.map((tournament) => (
        <Card key={tournament.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{tournament.name}</CardTitle>
                <CardDescription>
                  {new Date(tournament.startDate).toLocaleDateString("he-IL")} -{" "}
                  {new Date(tournament.endDate).toLocaleDateString("he-IL")}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{getTournamentTypeText(tournament.type)}</Badge>
                  <AdminEditButton 
                    entityId={tournament.id} 
                    entityType="tournament" 
                    className="bg-blue-50 rounded-lg border border-blue-100 p-1 hover:bg-blue-100"
                  />
                </div>
                <div className="flex items-center mt-2">
                  <span className={`h-2 w-2 rounded-full ${getStatusColor(tournament.status)} mr-2`} />
                  <span className="text-sm text-muted-foreground">
                    {getStatusText(tournament.status)}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span>{tournament.participantsCount} משתתפים</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/tournaments/${tournament.id}`}>
                צפה בטורניר
                <ArrowLeft className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

