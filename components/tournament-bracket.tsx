"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { TableIcon as TableTennis, Star, Trophy, Award } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getTournament } from "@/lib/db"  // במקום "@/lib/api"
import { useState } from "react"
import React from "react"
import Image from "next/image"
import { getImageUrl } from "@/lib/utils"

// Update the TournamentBracket component to use the appropriate display based on format
export function TournamentBracket({ tournament }: { tournament: any }) {
  if (!tournament) return null;
  
  console.log("Tournament format:", tournament.format); // לוג עזר - יופיע בקונסול

  // Choose the appropriate bracket component based on tournament format
  if (tournament.format === 'league') {
    return <LeagueTable tournament={tournament} />;
  } else if (tournament.format === 'groups_knockout' || tournament.format === 'group+knockout') {
    return <GroupsKnockoutBracket tournament={tournament} />;
  } else {
    return <KnockoutBracket tournament={tournament} />;
  }
}

// New component for dynamic knockout bracket
function KnockoutBracket({ tournament }: { tournament: any }) {
  // Sort matches by round
  const matches = tournament?.matches || [];
  const players = tournament?.players || [];
  
  // Get the maximum round number
  const maxRound = matches.length > 0 
    ? Math.max(...matches.map((m: any) => m.round)) 
    : 1;
  
  // Group matches by round
  const matchesByRound = Array.from({ length: maxRound }, (_, i) => i + 1).map(round => {
    return matches.filter((m: any) => m.round === round);
  });

  // Find player name by ID
  const getPlayerName = (playerId: string) => {
    const player = players.find((p: any) => p.id === playerId);
    return player ? player.name : 'Unknown';
  };

  // Find player initials by ID
  const getPlayerInitials = (playerId: string) => {
    const player = players.find((p: any) => p.id === playerId);
    return player && typeof player.initials === 'string' ? player.initials : '';
  };

  // Get player avatar
  const getPlayerAvatar = (playerId: string) => {
    const player = players.find((p: any) => p.id === playerId);
    if (!player || !player.avatar) {
      console.log('No avatar found for player ID:', playerId);
      return '/placeholder-user.jpg';
    }
    
    console.log('Player avatar found:', player.avatar);
    return player.avatar; // Return raw avatar, will be processed by getImageUrl later
  };

  // Get player level
  const getPlayerLevel = (playerId: string) => {
    const player = players.find((p: any) => p.id === playerId);
    return player?.level || 3;
  };

  // If no matches, show a message
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] bg-blue-50 rounded-lg p-6 text-center">
        <Trophy className="h-16 w-16 text-blue-300 mb-4" />
        <h3 className="text-xl font-semibold text-blue-700 mb-2">עדיין אין משחקים בטורניר</h3>
        <p className="text-blue-600">המשחקים יופיעו כאן לאחר שיתווספו</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className={`h-2 w-full ${tournament.format === 'league' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
      <div className="min-w-[800px] p-4">
        <div className="flex justify-around h-[500px]">
          {/* Render each round */}
          {matchesByRound.map((roundMatches, roundIndex) => (
            <div 
              key={`round-${roundIndex}`} 
              className={cn(
                "flex flex-col justify-around",
                roundIndex > 0 && roundIndex < matchesByRound.length - 1 && "mt-[60px] mb-[60px]",
                roundIndex === matchesByRound.length - 1 && "justify-center" // Final round is centered
              )}
            >
              {/* Render matches in this round */}
              {roundMatches.map((match: any) => (
                <MatchCard
                  key={match.id}
                  player1={{
                    name: getPlayerName(match.player1Id),
                    avatar: getPlayerAvatar(match.player1Id),
                    initials: getPlayerInitials(match.player1Id),
                    score: match.player1Score,
                    level: getPlayerLevel(match.player1Id),
                  }}
                  player2={{
                    name: getPlayerName(match.player2Id),
                    avatar: getPlayerAvatar(match.player2Id),
                    initials: getPlayerInitials(match.player2Id),
                    score: match.player2Score,
                    level: getPlayerLevel(match.player2Id),
                  }}
                  completed={match.status === "completed"}
                  winner={
                    match.status === "completed" 
                      ? match.player1Score > match.player2Score 
                        ? 1 
                        : 2
                      : undefined
                  }
                  isFinal={roundIndex === matchesByRound.length - 1}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface PlayerInfo {
  name: string
  avatar: string
  initials: string
  score?: number
  level?: number
}

interface MatchCardProps {
  player1: PlayerInfo
  player2: PlayerInfo
  completed: boolean
  winner?: number
  isFinal?: boolean
}

function MatchCard({ player1, player2, completed, winner, isFinal = false }: MatchCardProps) {
  const ensureValidImageUrl = (avatar: string | undefined) => {
    if (!avatar) return '/placeholder-user.jpg';
    console.log('Tournament bracket avatar:', avatar);
    return getImageUrl(avatar);
  };

  return (
    <Card
      className={cn(
        "w-[220px] p-3",
        isFinal && "border-yellow-500/50 dark:border-yellow-500/20 bg-gradient-to-br from-yellow-50/50 to-transparent dark:from-yellow-950/50"
      )}
    >
      <div className="space-y-2">
        <div
          className={cn(
            "flex items-center gap-2 p-1.5 rounded transition-colors",
            completed && winner === 1 && "bg-gradient-to-r from-primary/10 to-transparent"
          )}
        >
          <div className="relative">
            <Avatar className={cn(
              "h-10 w-10 transition-all duration-300 border-2",
              completed && winner === 1 
                ? "border-green-500 shadow-lg shadow-green-500/20" 
                : "border-gray-200"
            )}>
              {player1.avatar ? (
                <div className="h-full w-full overflow-hidden rounded-full">
                  <img
                    src={ensureValidImageUrl(player1.avatar)}
                    alt={player1.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      console.log('Error loading player1 image');
                      (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                    }}
                  />
                </div>
              ) : (
                <AvatarFallback className={cn(
                  completed && winner === 1 ? "bg-green-500" : "bg-blue-500",
                  "text-white font-semibold"
                )}>
                  {typeof player1.initials === 'string' ? player1.initials : ''}
                </AvatarFallback>
              )}
            </Avatar>
            {player1.level && player1.level > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-sm">
                {player1.level}
              </div>
            )}
            {completed && winner === 1 && (
              <div className="absolute -top-1 -right-1 bg-green-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-sm">
                ✓
              </div>
            )}
          </div>
          <span className={cn(
            "text-sm font-medium flex-1 truncate",
            completed && winner === 1 && "font-bold text-primary"
          )}>{player1.name}</span>
          <div className="flex items-center">
            <span
              className={cn(
                "text-sm font-bold px-1.5 py-0.5 rounded",
                completed && winner === 1 ? "bg-green-100 text-green-800" : "text-gray-600"
              )}
            >
              {player1.score !== undefined ? player1.score : "-"}
            </span>
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 p-1.5 rounded transition-colors",
            completed && winner === 2 && "bg-gradient-to-r from-primary/10 to-transparent"
          )}
        >
          <div className="relative">
            <Avatar className={cn(
              "h-10 w-10 transition-all duration-300 border-2",
              completed && winner === 2 
                ? "border-green-500 shadow-lg shadow-green-500/20" 
                : "border-gray-200"
            )}>
              {player2.avatar ? (
                <div className="h-full w-full overflow-hidden rounded-full">
                  <img
                    src={ensureValidImageUrl(player2.avatar)}
                    alt={player2.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      console.log('Error loading player2 image');
                      (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                    }}
                  />
                </div>
              ) : (
                <AvatarFallback className={cn(
                  completed && winner === 2 ? "bg-green-500" : "bg-blue-500",
                  "text-white font-semibold"
                )}>
                  {typeof player2.initials === 'string' ? player2.initials : ''}
                </AvatarFallback>
              )}
            </Avatar>
            {player2.level && player2.level > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-sm">
                {player2.level}
              </div>
            )}
            {completed && winner === 2 && (
              <div className="absolute -top-1 -right-1 bg-green-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-sm">
                ✓
              </div>
            )}
          </div>
          <span className={cn(
            "text-sm font-medium flex-1 truncate",
            completed && winner === 2 && "font-bold text-primary"
          )}>{player2.name}</span>
          <div className="flex items-center">
            <span
              className={cn(
                "text-sm font-bold px-1.5 py-0.5 rounded",
                completed && winner === 2 ? "bg-green-100 text-green-800" : "text-gray-600"
              )}
            >
              {player2.score !== undefined ? player2.score : "-"}
            </span>
          </div>
        </div>
        {completed && (
          <div className="mt-1 pt-1 border-t border-dashed border-muted-foreground/20 text-center">
            <span className="text-xs text-muted-foreground">
              {winner ? `${winner === 1 ? player1.name : player2.name} ניצח` : "תיקו"}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}

// New component for league format
function LeagueTable({ tournament }: { tournament: any }) {
  const router = useRouter();
  const matches = tournament?.matches || [];
  const players = tournament?.players || [];
  
  // Function to safely handle player avatar
  const ensurePlayerImageUrl = (avatar: string | undefined) => {
    if (!avatar) return '/placeholder-user.jpg';
    console.log('League table avatar:', avatar);
    return getImageUrl(avatar);
  };
  
  // Calculate standings for the league
  const standings = React.useMemo(() => {
    const playerStats: Record<string, {
      playerId: string,
      playerName: string,
      playerInitials: string,
      playerAvatar: string,
      playerLevel: number,
      played: number,
      wins: number,
      losses: number,
      draws: number,
      points: number,
      pointsFor: number,
      pointsAgainst: number,
      pointsDiff: number
    }> = {};
    
    // Initialize player stats
    players.forEach((player: any) => {
      playerStats[player.id] = {
        playerId: player.id,
        playerName: player.name,
        playerInitials: player.initials || '',
        playerAvatar: player.avatar || null, // Store raw avatar path, will be processed by getImageUrl
        playerLevel: player.level || 3,
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointsDiff: 0
      };
    });
    
    // Calculate stats from matches
    matches.forEach((match: any) => {
      if (match.status === 'completed') {
        const player1Id = match.player1Id;
        const player2Id = match.player2Id;
        const player1Score = match.player1Score || 0;
        const player2Score = match.player2Score || 0;
        
        // Update player 1 stats
        if (playerStats[player1Id]) {
          playerStats[player1Id].played++;
          playerStats[player1Id].pointsFor += player1Score;
          playerStats[player1Id].pointsAgainst += player2Score;
          
          if (player1Score > player2Score) {
            playerStats[player1Id].wins++;
            playerStats[player1Id].points += 3; // 3 points for a win
          } else if (player1Score < player2Score) {
            playerStats[player1Id].losses++;
          } else {
            playerStats[player1Id].draws++;
            playerStats[player1Id].points += 1; // 1 point for a draw
          }
        }
        
        // Update player 2 stats
        if (playerStats[player2Id]) {
          playerStats[player2Id].played++;
          playerStats[player2Id].pointsFor += player2Score;
          playerStats[player2Id].pointsAgainst += player1Score;
          
          if (player2Score > player1Score) {
            playerStats[player2Id].wins++;
            playerStats[player2Id].points += 3; // 3 points for a win
          } else if (player2Score < player1Score) {
            playerStats[player2Id].losses++;
          } else {
            playerStats[player2Id].draws++;
            playerStats[player2Id].points += 1; // 1 point for a draw
          }
        }
      }
    });
    
    // Calculate point difference and convert to array
    const standingsArray = Object.values(playerStats).map(player => {
      player.pointsDiff = player.pointsFor - player.pointsAgainst;
      return player;
    });
    
    // Sort by points (desc), then point difference (desc), then goals scored (desc)
    return standingsArray.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.pointsDiff !== b.pointsDiff) return b.pointsDiff - a.pointsDiff;
      return b.pointsFor - a.pointsFor;
    });
  }, [matches, players]);
  
  // Function to get player level color
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-green-500';
      case 5: return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <div className="h-2 w-full bg-blue-500"></div>
      <div className="min-w-[800px] p-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-2xl font-bold tracking-tight">טבלת הליגה</h3>
            <p className="text-sm text-muted-foreground">דירוג שחקנים לפי נקודות, הפרש שערים ושערי זכות</p>
          </div>
          <div className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-right font-medium">מיקום</th>
                  <th className="p-4 text-right font-medium">שחקן</th>
                  <th className="p-4 text-center font-medium">רמה</th>
                  <th className="p-4 text-center font-medium">משחקים</th>
                  <th className="p-4 text-center font-medium">נצחונות</th>
                  <th className="p-4 text-center font-medium">תיקו</th>
                  <th className="p-4 text-center font-medium">הפסדים</th>
                  <th className="p-4 text-center font-medium">נקודות</th>
                  <th className="p-4 text-center font-medium">שערי זכות</th>
                  <th className="p-4 text-center font-medium">שערי חובה</th>
                  <th className="p-4 text-center font-medium">הפרש</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((player, index) => (
                  <tr 
                    key={player.playerId} 
                    className={cn(
                      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                      index === 0 ? "bg-green-50" : "", // Highlight the champion
                      index === 1 ? "bg-blue-50" : "", // Highlight the runner-up
                      index === 2 ? "bg-yellow-50" : "" // Highlight third place
                    )}
                  >
                    <td className="p-4 text-right font-medium">
                      {index + 1}
                      {index === 0 && <Trophy className="inline-block ml-2 h-4 w-4 text-yellow-500" />}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center gap-2">
                        <div className="relative h-10 w-10">
                          {player.playerAvatar ? (
                            <img
                              src={ensurePlayerImageUrl(player.playerAvatar)}
                              alt={player.playerName}
                              className="rounded-full object-cover h-full w-full"
                              onError={(e) => {
                                console.log('Error loading player image in league table');
                                (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                              <span className="text-sm font-medium">
                                {player.playerInitials || player.playerName.substring(0, 2)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{player.playerName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <div className={cn("h-3 w-3 rounded-full", getLevelColor(player.playerLevel))}></div>
                      </div>
                    </td>
                    <td className="p-4 text-center">{player.played}</td>
                    <td className="p-4 text-center font-medium text-green-600">{player.wins}</td>
                    <td className="p-4 text-center text-gray-600">{player.draws}</td>
                    <td className="p-4 text-center font-medium text-red-600">{player.losses}</td>
                    <td className="p-4 text-center font-bold">{player.points}</td>
                    <td className="p-4 text-center">{player.pointsFor}</td>
                    <td className="p-4 text-center">{player.pointsAgainst}</td>
                    <td className={cn(
                      "p-4 text-center font-medium",
                      player.pointsDiff > 0 ? "text-green-600" : 
                      player.pointsDiff < 0 ? "text-red-600" : "text-gray-600"
                    )}>
                      {player.pointsDiff > 0 ? `+${player.pointsDiff}` : player.pointsDiff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-50"></div>
                <span className="text-sm">אלוף</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-50"></div>
                <span className="text-sm">סגן אלוף</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-50"></div>
                <span className="text-sm">מקום שלישי</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent matches section */}
        <div className="mt-8 rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-2xl font-bold tracking-tight">תוצאות אחרונות</h3>
            <p className="text-sm text-muted-foreground">המשחקים האחרונים שהסתיימו בליגה</p>
          </div>
          <div className="p-6 grid gap-4">
            {matches
              .filter((match: any) => match.status === 'completed')
              .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 5)
              .map((match: any) => {
                const player1 = players.find((p: any) => p.id === match.player1Id);
                const player2 = players.find((p: any) => p.id === match.player2Id);
                
                return (
                  <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{player1?.name || 'Unknown'}</div>
                      <div className={cn(
                        "px-2 py-1 rounded text-white font-bold",
                        match.player1Score > match.player2Score ? "bg-green-500" : 
                        match.player1Score < match.player2Score ? "bg-red-500" : "bg-gray-500"
                      )}>
                        {match.player1Score}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">vs</div>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "px-2 py-1 rounded text-white font-bold",
                        match.player2Score > match.player1Score ? "bg-green-500" : 
                        match.player2Score < match.player1Score ? "bg-red-500" : "bg-gray-500"
                      )}>
                        {match.player2Score}
                      </div>
                      <div className="font-medium">{player2?.name || 'Unknown'}</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

// New component for groups + knockout format
function GroupsKnockoutBracket({ tournament }: { tournament: any }) {
  const router = useRouter();
  const matches = tournament?.matches || [];
  const players = tournament?.players || [];
  const [activeTab, setActiveTab] = useState("groups");
  
  // Group matches by stage (group or knockout)
  const groupMatches = matches.filter((m: any) => m.stage === 'group');
  const knockoutMatches = matches.filter((m: any) => m.stage === 'knockout');
  
  // Group matches by group name
  const matchesByGroup: Record<string, any[]> = {};
  groupMatches.forEach((match: any) => {
    if (!matchesByGroup[match.groupName]) {
      matchesByGroup[match.groupName] = [];
    }
    matchesByGroup[match.groupName].push(match);
  });
  
  // Get unique group names
  const groupNames = Object.keys(matchesByGroup).sort();
  
  // Calculate standings for each group
  const groupStandings: Record<string, any[]> = {};
  
  groupNames.forEach(groupName => {
    const groupPlayers = new Set<string>();
    
    // Collect all players in this group
    matchesByGroup[groupName].forEach((match: any) => {
      groupPlayers.add(match.player1Id);
      groupPlayers.add(match.player2Id);
    });
    
    // Initialize standings for each player
    const standings = Array.from(groupPlayers).map(playerId => {
      const player = players.find((p: any) => p.id === playerId);
      return {
        playerId,
        playerName: player ? player.name : 'Unknown',
        playerInitials: player && typeof player.initials === 'string' ? player.initials : '',
        playerAvatar: player?.avatar || null, // Store raw avatar path, will be processed by getImageUrl
        playerLevel: player?.level || 3,
        played: 0,
        wins: 0,
        losses: 0,
        points: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointsDiff: 0
      };
    });
    
    // Calculate stats for each player
    matchesByGroup[groupName].forEach((match: any) => {
      if (match.status === 'completed') {
        // Player 1 stats
        const player1Standing = standings.find(s => s.playerId === match.player1Id);
        if (player1Standing) {
          player1Standing.played++;
          player1Standing.pointsFor += match.player1Score || 0;
          player1Standing.pointsAgainst += match.player2Score || 0;
          
          if ((match.player1Score || 0) > (match.player2Score || 0)) {
            player1Standing.wins++;
            player1Standing.points += 3; // 3 points for a win
          } else {
            player1Standing.losses++;
          }
        }
        
        // Player 2 stats
        const player2Standing = standings.find(s => s.playerId === match.player2Id);
        if (player2Standing) {
          player2Standing.played++;
          player2Standing.pointsFor += match.player2Score || 0;
          player2Standing.pointsAgainst += match.player1Score || 0;
          
          if ((match.player2Score || 0) > (match.player1Score || 0)) {
            player2Standing.wins++;
            player2Standing.points += 3; // 3 points for a win
          } else {
            player2Standing.losses++;
          }
        }
      }
    });
    
    // Calculate point difference
    standings.forEach(standing => {
      standing.pointsDiff = standing.pointsFor - standing.pointsAgainst;
    });
    
    // Sort standings by points, then by point difference
    const sortedStandings = [...standings].sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points; // Higher points first
      }
      return b.pointsDiff - a.pointsDiff; // Higher point difference first
    });
    
    groupStandings[groupName] = sortedStandings;
  });
  
  // If no matches, show a message
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] bg-blue-50 rounded-lg p-6 text-center">
        <Trophy className="h-16 w-16 text-blue-300 mb-4" />
        <h3 className="text-xl font-semibold text-blue-700 mb-2">עדיין אין משחקים בטורניר</h3>
        <p className="text-blue-600">המשחקים יופיעו כאן לאחר שיתווספו</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="groups">שלב הבתים</TabsTrigger>
          <TabsTrigger value="knockout">שלב הנוק-אאוט</TabsTrigger>
        </TabsList>
        
        <TabsContent value="groups" className="space-y-6">
          {groupNames.length > 0 ? (
            groupNames.map(groupName => (
              <Card key={groupName} className="overflow-hidden">
                <CardHeader className="bg-blue-50 py-3">
                  <CardTitle className="text-lg font-semibold text-blue-700">{groupName}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-2 text-right">שחקן</th>
                          <th className="px-4 py-2 text-center">משחקים</th>
                          <th className="px-4 py-2 text-center">נצחונות</th>
                          <th className="px-4 py-2 text-center">הפסדים</th>
                          <th className="px-4 py-2 text-center">נקודות</th>
                          <th className="px-4 py-2 text-center">הפרש</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupStandings[groupName].map((standing, index) => (
                          <tr 
                            key={standing.playerId} 
                            className={cn(
                              "border-b hover:bg-gray-50",
                              index < (tournament.advanceCount || 2) && "bg-green-50" // Highlight advancing players
                            )}
                          >
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6 ring-1 ring-muted">
                                  <div className="h-full w-full overflow-hidden rounded-full">
                                    <img 
                                      src={getImageUrl(standing.playerAvatar)} 
                                      alt={standing.playerName}
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        console.log('Error loading player image in group standings');
                                        (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                                      }}
                                    />
                                  </div>
                                  <AvatarFallback>{standing.playerInitials}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{standing.playerName}</span>
                                {index < (tournament.advanceCount || 2) && (
                                  <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                                    עולה
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-center">{standing.played}</td>
                            <td className="px-4 py-2 text-center">{standing.wins}</td>
                            <td className="px-4 py-2 text-center">{standing.losses}</td>
                            <td className="px-4 py-2 text-center font-bold">{standing.points}</td>
                            <td className="px-4 py-2 text-center">{standing.pointsDiff}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="p-4 space-y-2">
                    <h4 className="font-medium text-blue-700">משחקים בבית</h4>
                    <div className="grid gap-2">
                      {matchesByGroup[groupName].map((match: any) => {
                        const player1 = players.find((p: any) => p.id === match.player1Id);
                        const player2 = players.find((p: any) => p.id === match.player2Id);
                        
                        return (
                          <div 
                            key={match.id}
                            className="flex items-center justify-between p-2 rounded-md border hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push(`/matches/${match.id}`)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{player1?.name || 'Unknown'}</span>
                              <span className="text-gray-500">vs</span>
                              <span className="font-medium">{player2?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {match.status === 'completed' ? (
                                <span className="font-bold">
                                  {match.player1Score} - {match.player2Score}
                                </span>
                              ) : (
                                <Badge variant="outline" className="text-blue-600">
                                  {match.status === 'scheduled' ? 'מתוכנן' : 'בתהליך'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] bg-blue-50 rounded-lg p-6 text-center">
              <p className="text-blue-600">אין בתים מוגדרים עדיין</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="knockout">
          {knockoutMatches.length > 0 ? (
            <KnockoutBracket tournament={{ matches: knockoutMatches, players }} />
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] bg-blue-50 rounded-lg p-6 text-center">
              <p className="text-blue-600">שלב הנוק-אאוט יתחיל לאחר סיום שלב הבתים</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

