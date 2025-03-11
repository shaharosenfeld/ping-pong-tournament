"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Trophy, Star, TrendingUp, Medal, Award, Zap } from "lucide-react"
import { cn, getWinRate, getLevelStarClass, getImageUrl } from "@/lib/utils"
import { AdminEditButton } from "./admin-edit-button"
import { motion } from "framer-motion"
import Link from "next/link"

interface Player {
  id: string
  name: string
  avatar?: string
  initials: string
  wins: number
  losses: number
  level: number
}

export const PlayersList = ({ players, tournament, isAdmin }: { 
  players: Player[], 
  tournament?: any,
  isAdmin?: boolean 
}) => {
  if (!players || players.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        אין שחקנים להצגה
      </div>
    )
  }

  const getRandomColor = (playerName: string) => {
    // יצירת צבע אקראי אך קונסיסטנטי לפי שם השחקן
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", 
      "bg-orange-500", "bg-indigo-500", "bg-cyan-500", "bg-emerald-500"
    ];
    
    // יצירת ערך מספרי מהשם
    let nameValue = 0;
    for (let i = 0; i < playerName.length; i++) {
      nameValue += playerName.charCodeAt(i);
    }
    
    return colors[nameValue % colors.length];
  };

  // מיון השחקנים לפי רמה ומספר ניצחונות
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.level !== b.level) return b.level - a.level;
    return b.wins - a.wins;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sortedPlayers.map((player, index) => {
        const playerColor = getRandomColor(player.name);
        const winRate = getWinRate(player.wins, player.losses);
        
        return (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Link href={`/players/${player.id}`} className="block">
              <Card
                className={cn(
                  "p-5 transition-all hover:shadow-lg overflow-hidden relative cursor-pointer transform hover:scale-105 transition-transform duration-300",
                  player.level >= 4 && "bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/50"
                )}
              >
                {player.level === 5 && (
                  <div className="absolute -top-6 -right-6 w-12 h-12 bg-yellow-500/20 rounded-full blur-xl"></div>
                )}
                
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="relative">
                    <Avatar className={cn(
                      "h-24 w-24 border-4 transition-all duration-300 shadow-md",
                      player.level >= 4 ? "border-yellow-400" : 
                      player.level >= 3 ? "border-blue-400" : 
                      "border-gray-200"
                    )}>
                      {player.avatar ? (
                        <div className="h-full w-full overflow-hidden rounded-full">
                          <img 
                            src={getImageUrl(player.avatar)} 
                            alt={player.name} 
                            className="h-full w-full object-cover rounded-full"
                            onError={(e) => {
                              console.log('Error loading player image in players list');
                              // First attempt with cache busting
                              const target = e.target as HTMLImageElement;
                              const originalSrc = target.src;
                              const newSrc = `${originalSrc}?t=${new Date().getTime()}`;
                              console.log('Trying with cache busting:', newSrc);
                              target.src = newSrc;
                              
                              // On second failure, use placeholder
                              target.onerror = () => {
                                console.log('Second attempt failed, using placeholder');
                                target.src = '/placeholder-user.jpg';
                                target.onerror = null; // Prevent infinite loop
                              };
                            }}
                          />
                        </div>
                      ) : (
                        <AvatarFallback className={cn("text-xl font-bold text-white rounded-full", playerColor)}>
                          {typeof player.initials === 'string' ? player.initials : ''}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    {/* תג רמה */}
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md border-2 border-white">
                      {player.level}
                    </div>
                    
                    {/* מדליה לשחקן מוביל */}
                    {index === 0 && (
                      <div className="absolute -top-2 -left-2">
                        <Medal className="h-8 w-8 text-yellow-500 drop-shadow-md" fill="#FFC107" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 w-full">
                    <h3 className="font-bold text-lg">{player.name}</h3>
                    
                    <div className="flex items-center justify-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-5 w-5 transition-all",
                            getLevelStarClass(i, player.level)
                          )}
                          fill={i < player.level ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 px-2">
                      <div className="flex flex-col items-center bg-green-50 p-2 rounded-lg w-[45%]">
                        <Trophy className="h-4 w-4 text-green-600 mb-1" />
                        <span className="text-lg font-bold text-green-700">{player.wins}</span>
                        <span className="text-xs text-green-600">ניצחונות</span>
                      </div>
                      
                      <div className="flex flex-col items-center bg-red-50 p-2 rounded-lg w-[45%]">
                        <TrendingUp className="h-4 w-4 text-red-600 mb-1" />
                        <span className="text-lg font-bold text-red-700">{player.losses}</span>
                        <span className="text-xs text-red-600">הפסדים</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">אחוז ניצחונות</span>
                        <span className="font-bold text-blue-600">{winRate}%</span>
                      </div>
                      <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${winRate}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <div className="mt-3 pt-2 flex justify-center">
                        <AdminEditButton entityId={player.id} entityType="player" small />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  )
}

