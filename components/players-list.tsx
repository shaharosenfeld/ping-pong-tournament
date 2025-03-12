"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Star, TrendingUp, Medal, Award, Zap, Eye, Pencil, Trash } from "lucide-react"
import { cn, getWinRate, getLevelStarClass, getImageUrl } from "@/lib/utils"
import { AdminEditButton } from "./admin-edit-button"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAuthHeaders } from '@/lib/admin-utils'

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

  const handleViewPlayer = (playerId: string) => {
    window.location.href = `/players/${playerId}`;
  };

  const handleEditPlayer = (playerId: string) => {
    window.location.href = `/players/${playerId}/edit`;
  };

  const handleDeletePlayer = (playerId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק שחקן זה?')) {
      // קבלת כותרות הרשאה עם הפונקציה המשופרת
      const headers = getAuthHeaders();
      
      // Call delete API
      fetch(`/api/players/${playerId}`, {
        method: 'DELETE',
        headers: headers
      })
      .then(response => {
        if (!response.ok) throw new Error('שגיאה במחיקת השחקן');
        return response.json();
      })
      .then(() => {
        // Refresh the page after successful deletion
        window.location.reload();
      })
      .catch(error => {
        console.error('Error deleting player:', error);
        alert('אירעה שגיאה במחיקת השחקן');
      });
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sortedPlayers.map((player, index) => {
        const playerColor = getRandomColor(player.name);
        const winRate = getWinRate(player.wins, player.losses);
        
        return (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="overflow-hidden hover:shadow-md transition-all">
              <CardContent className="p-0">
                <div className="relative">
                  {/* Player Level Indicator on top of card */}
                  {player.level > 0 && (
                    <div className="absolute top-0 left-0 p-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        רמה {player.level}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Admin actions at the top right */}
                  {isAdmin && (
                    <div className="absolute top-0 right-0 p-2 flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/80"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditPlayer(player.id);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">ערוך</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/80 text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeletePlayer(player.id);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">מחק</span>
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-col items-center p-4 pt-8">
                    <Avatar className="h-20 w-20 mb-3 border-2 border-blue-100">
                      {player.avatar ? (
                        <AvatarImage 
                          src={getImageUrl(player.avatar)} 
                          alt={player.name} 
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback className={cn("text-white", playerColor)}>
                          {player.initials || player.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    <h3 className="font-semibold text-xl mb-1">{player.name}</h3>
                    
                    {/* Win rate and stats */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {player.wins} ניצחונות
                      </Badge>
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        {player.losses} הפסדים
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 w-full mt-2">
                      <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg">
                        <span className="text-xs text-blue-700 mb-1">דירוג</span>
                        <span className="text-lg font-bold text-blue-800">{player.level * 100 + winRate}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-purple-50 rounded-lg">
                        <span className="text-xs text-purple-700 mb-1">יחס נצחונות</span>
                        <span className="text-lg font-bold text-purple-800">{winRate}%</span>
                      </div>
                    </div>
                    
                    <Link 
                      href={`/players/${player.id}`}
                      className="w-full mt-4"
                    >
                      <Button 
                        variant="default" 
                        className="w-full"
                      >
                        צפה בפרופיל
                        <Eye className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

