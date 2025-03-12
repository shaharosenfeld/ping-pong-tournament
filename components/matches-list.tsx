"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { 
  Edit2, 
  Trophy, 
  Clock, 
  MapPin, 
  Calendar, 
  Clock as ClockIcon, 
  MapPin as MapPinIcon,
  ChevronRight,
  Star,
  Swords
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AdminEditButton } from "./admin-edit-button"
import { motion } from "framer-motion"
import { getImageUrl } from "@/lib/utils"
import { useAuth } from "@/app/hooks/use-auth"
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react"

interface Player {
  id: string
  name: string
  avatar?: string
  level: number
}

interface Match {
  id: string
  player1: Player
  player2: Player
  score1?: number
  score2?: number
  status: "pending" | "in_progress" | "completed" | "cancelled"
  date: string
  time: string
  location?: string
  round?: string
}

export const MatchesList = ({ matches }: { matches: Match[] }) => {
  const [isHovering, setIsHovering] = useState<string | null>(null)
  const { isAdmin } = useAuth()

  useEffect(() => {
    // No need to check localStorage here anymore
    // const adminStatus = localStorage.getItem("isAdmin")
    // if (adminStatus === "true") {
    //   setIsAdmin(true)
    // }
    
    // Keep any other useEffect logic if needed
  }, [])

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        אין משחקים להצגה
      </div>
    )
  }

  const getMatchStatusColor = (status: Match["status"]) => {
    switch (status) {
      case "completed":
        return "default" as const
      case "in_progress":
        return "secondary" as const
      case "cancelled":
        return "destructive" as const
      default:
        return "outline" as const
    }
  }

  const getMatchStatusText = (status: Match["status"]) => {
    switch (status) {
      case "completed":
        return "הסתיים"
      case "in_progress":
        return "בתהליך"
      case "cancelled":
        return "בוטל"
      default:
        return "ממתין"
    }
  }

  const getWinnerStyles = (match: Match, playerNum: 1 | 2) => {
    if (match.status !== "completed" || !match.score1 || !match.score2) return "";
    
    const isWinner = playerNum === 1 
      ? match.score1 > match.score2 
      : match.score2 > match.score1;
      
    return isWinner ? "font-bold text-green-600" : "";
  }

  const getPlayerBgColor = (playerName: string) => {
    // יצירת צבע עקבי לפי שם השחקן
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", 
      "bg-orange-500", "bg-indigo-500", "bg-cyan-500", "bg-emerald-500"
    ];
    
    let nameValue = 0;
    for (let i = 0; i < playerName.length; i++) {
      nameValue += playerName.charCodeAt(i);
    }
    
    return colors[nameValue % colors.length];
  };

  return (
    <div className="space-y-4">
      <div className="w-full overflow-auto">
        <Table className="mobile-table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]" data-label="מזהה">מזהה</TableHead>
              <TableHead data-label="שחקן 1">שחקן 1</TableHead>
              <TableHead data-label="שחקן 2">שחקן 2</TableHead>
              <TableHead className="text-center" data-label="תוצאה">תוצאה</TableHead>
              <TableHead data-label="תאריך">תאריך</TableHead>
              <TableHead data-label="סטטוס">סטטוס</TableHead>
              <TableHead className="text-right" data-label="פעולות">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => (
              <TableRow 
                key={match.id}
                className="group hover:bg-muted/50"
              >
                <TableCell 
                  className="font-medium text-xs md:text-sm" 
                  data-label="מזהה"
                >
                  {match.id.substring(0, 8)}...
                </TableCell>
                <TableCell 
                  className="font-medium text-sm flex items-center gap-2" 
                  data-label="שחקן 1"
                >
                  <Avatar className="h-8 w-8 hidden md:inline-flex">
                    {match.player1.avatar ? (
                      <AvatarImage src={match.player1.avatar} alt={match.player1.name} />
                    ) : (
                      <AvatarFallback>{match.player1.name.charAt(0)}</AvatarFallback>
                    )}
                  </Avatar>
                  <Link 
                    href={`/players/${match.player1.id}`}
                    className="hover:text-primary hover:underline truncate"
                  >
                    {match.player1.name}
                  </Link>
                  {match.round && (
                    <Badge variant="outline" className="ml-2 hidden md:inline-flex">
                      {match.round}
                    </Badge>
                  )}
                </TableCell>
                <TableCell 
                  className="font-medium text-sm flex items-center gap-2" 
                  data-label="שחקן 2"
                >
                  <Avatar className="h-8 w-8 hidden md:inline-flex">
                    {match.player2.avatar ? (
                      <AvatarImage src={match.player2.avatar} alt={match.player2.name} />
                    ) : (
                      <AvatarFallback>{match.player2.name.charAt(0)}</AvatarFallback>
                    )}
                  </Avatar>
                  <Link 
                    href={`/players/${match.player2.id}`}
                    className="hover:text-primary hover:underline truncate"
                  >
                    {match.player2.name}
                  </Link>
                  {match.round && (
                    <Badge variant="outline" className="ml-2 hidden md:inline-flex">
                      {match.round}
                    </Badge>
                  )}
                </TableCell>
                <TableCell 
                  className="text-center font-semibold" 
                  data-label="תוצאה"
                >
                  {match.status === "completed" ? (
                    <span className="text-sm md:text-base">
                      {match.score1}-{match.score2}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">טרם נקבע</span>
                  )}
                </TableCell>
                <TableCell 
                  className="text-sm text-muted-foreground" 
                  data-label="תאריך"
                >
                  {new Date(match.date).toLocaleDateString("he-IL")}
                </TableCell>
                <TableCell data-label="סטטוס">
                  <Badge variant={getMatchStatusColor(match.status)}>
                    {getMatchStatusText(match.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" data-label="פעולות">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {}}
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span className="sr-only">צפה</span>
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {}}
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span className="sr-only">ערוך</span>
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => {}}
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span className="sr-only">מחק</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

