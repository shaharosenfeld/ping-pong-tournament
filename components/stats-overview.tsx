"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Star } from "lucide-react"
import { getImageUrl } from "@/lib/utils"

// Mock data for player stats
const PLAYER_STATS = [
  {
    id: "1",
    name: "דני אבדיה",
    level: 5,
    initials: "DA",
    avatar: "/placeholder-user.jpg",
    winRate: 87,
    matchesPlayed: 34,
    highestScore: 21,
  },
  {
    id: "2",
    name: "גל מאיר",
    level: 4,
    initials: "GM",
    avatar: "/placeholder-user.jpg",
    winRate: 75,
    matchesPlayed: 28,
    highestScore: 19,
  },
  {
    id: "3",
    name: "שירה לוי",
    level: 3,
    initials: "SL",
    avatar: "/placeholder-user.jpg",
    winRate: 62,
    matchesPlayed: 42,
    highestScore: 18,
  },
  {
    id: "4",
    name: "איתי כהן",
    level: 2,
    initials: "IC",
    avatar: "/placeholder-user.jpg",
    winRate: 45,
    matchesPlayed: 22,
    highestScore: 15,
  },
]

export default function StatsOverview() {
  return (
    <div className="space-y-4">
      {PLAYER_STATS.map((player) => (
        <div
          key={player.id}
          className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 transition-colors"
        >
          <Avatar className="h-10 w-10 border-2 border-blue-300">
            {player.avatar ? (
              <div className="h-full w-full overflow-hidden rounded-full">
                <img 
                  src={getImageUrl(player.avatar)} 
                  alt={player.name} 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    console.log('Error loading player image in stats overview');
                    (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                  }}
                />
              </div>
            ) : (
              <AvatarFallback className="bg-blue-100 text-blue-800">{typeof player.initials === 'string' ? player.initials : ''}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-blue-800">{player.name}</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-xs ${i < player.level ? "text-yellow-500" : "text-gray-300"}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>רמת שחקן: {player.level}/5</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-medium text-blue-800">{player.winRate}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress
                value={player.winRate}
                className="h-2 bg-blue-100"
                style={{ "--progress-foreground": "linear-gradient(to right, rgb(34 197 94), rgb(59 130 246))" } as React.CSSProperties}
              />
              <span className="text-xs text-blue-600 whitespace-nowrap">
                {player.matchesPlayed}נ - {player.matchesPlayed - player.highestScore}ה
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

