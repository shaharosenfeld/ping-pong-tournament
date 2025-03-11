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
        return "bg-green-500"
      case "in_progress":
        return "bg-blue-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
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
      {matches.map((match, index) => {
        const isCompleted = match.status === "completed";
        const player1Winner = isCompleted && match.score1 !== undefined && match.score2 !== undefined && match.score1 > match.score2;
        const player2Winner = isCompleted && match.score1 !== undefined && match.score2 !== undefined && match.score2 > match.score1;
        
        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Link href={`/matches/${match.id}`}>
              <Card className="hover:shadow-md transition-all duration-300 overflow-hidden">
                <div className={cn(
                  "border-t-4",
                  player1Winner ? "border-t-green-500" : 
                  player2Winner ? "border-t-blue-500" : 
                  "border-t-gray-300"
                )}>
                  <CardHeader className="pb-3 pt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge className={getMatchStatusColor(match.status)}>
                          {getMatchStatusText(match.status)}
                        </Badge>
                        {match.round && (
                          <Badge variant="outline" className="ml-2">
                            {match.round}
                          </Badge>
                        )}
                      </div>
                      {isAdmin && (
                        <AdminEditButton entityId={match.id} entityType="match" small />
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-3">
                    <div className="flex flex-col md:flex-row items-center md:justify-between gap-4">
                      {/* שחקן 1 */}
                      <div className={cn(
                        "flex items-center gap-3", 
                        getWinnerStyles(match, 1)
                      )}>
                        <div className="relative">
                          <Avatar className={cn(
                            "h-14 w-14 border-2 transition-all", 
                            player1Winner ? "border-green-500 shadow-md" : "border-gray-200"
                          )}>
                            {match.player1.avatar ? (
                              <div className="h-full w-full overflow-hidden rounded-full">
                                <img 
                                  src={getImageUrl(match.player1.avatar)} 
                                  alt={match.player1.name} 
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    console.log('Error loading player1 image in match list');
                                    (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                                  }}
                                />
                              </div>
                            ) : (
                              <AvatarFallback className={cn(
                                "text-white font-semibold",
                                getPlayerBgColor(match.player1.name)
                              )}>
                                {typeof match.player1.name === 'string' ? match.player1.name.slice(0, 2) : ''}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          
                          {match.player1.level > 0 && (
                            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-sm">
                              {match.player1.level}
                            </div>
                          )}
                          
                          {player1Winner && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold border border-white shadow-sm">
                              ✓
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col">
                          <span className={cn(
                            "font-medium text-lg",
                            player1Winner && "text-green-600 font-bold"
                          )}>
                            {match.player1.name}
                          </span>
                          {isCompleted && (
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-3 w-3",
                                    i < match.player1.level 
                                      ? "text-yellow-500 fill-yellow-500" 
                                      : "text-gray-300"
                                  )}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* תוצאה */}
                      <div className="flex flex-col items-center">
                        <Swords className="text-gray-400 mb-1 h-5 w-5" />
                        <div className={cn(
                          "flex items-center gap-2 px-4 py-1.5 bg-gray-100 rounded-full font-bold text-lg",
                          isCompleted && "bg-blue-50"
                        )}>
                          <span className={player1Winner ? "text-green-600" : ""}>
                            {match.score1 ?? "-"}
                          </span>
                          <span className="text-gray-400 mx-1">:</span>
                          <span className={player2Winner ? "text-green-600" : ""}>
                            {match.score2 ?? "-"}
                          </span>
                        </div>
                      </div>
                      
                      {/* שחקן 2 */}
                      <div className={cn(
                        "flex items-center gap-3", 
                        getWinnerStyles(match, 2)
                      )}>
                        <div className="relative">
                          <Avatar className={cn(
                            "h-14 w-14 border-2 transition-all", 
                            player2Winner ? "border-green-500 shadow-md" : "border-gray-200"
                          )}>
                            {match.player2.avatar ? (
                              <div className="h-full w-full overflow-hidden rounded-full">
                                <img 
                                  src={getImageUrl(match.player2.avatar)} 
                                  alt={match.player2.name} 
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    console.log('Error loading player2 image in match list');
                                    (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                                  }}
                                />
                              </div>
                            ) : (
                              <AvatarFallback className={cn(
                                "text-white font-semibold",
                                getPlayerBgColor(match.player2.name)
                              )}>
                                {typeof match.player2.name === 'string' ? match.player2.name.slice(0, 2) : ''}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          
                          {match.player2.level > 0 && (
                            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-sm">
                              {match.player2.level}
                            </div>
                          )}
                          
                          {player2Winner && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold border border-white shadow-sm">
                              ✓
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col">
                          <span className={cn(
                            "font-medium text-lg",
                            player2Winner && "text-green-600 font-bold"
                          )}>
                            {match.player2.name}
                          </span>
                          {isCompleted && (
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-3 w-3",
                                    i < match.player2.level 
                                      ? "text-yellow-500 fill-yellow-500" 
                                      : "text-gray-300"
                                  )}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground mt-4 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(match.date).toLocaleDateString("he-IL")}
                        </div>
                        {match.time && (
                          <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {match.time}
                          </div>
                        )}
                      </div>
                      {match.location && (
                        <div className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {match.location}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  )
}

