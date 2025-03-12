"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Activity, TrendingUp, Medal, Table as TableTennis, Calendar, Star, Sparkles } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { getImageUrl } from "@/lib/utils"

// Variants for framer-motion animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

const MotionCard = motion(Card);

interface Player {
  id: string
  name: string
  avatar?: string
  initials: string
  wins: number
  losses: number
  level: number
  winRate: number
  avgScore: number
  rating: number
}

interface Tournament {
  id: string
  name: string
  date: string
  winner: string | null
  runnerUp: string | null
  players: number
  format: string
  matches: number
  completedMatches: number
}

interface MatchStats {
  totalMatches: number
  avgScore: number
  highestScore: number
  mostCommonScore: string
  scoreDistribution: Array<{
    score: string
    count: number
    percentage: number
  }>
  totalPlayers: number
  averageScore: number
  mostActivePlayer: {
    name: string
    matches: number
  }
}

interface FunStats {
  mostConsistentPlayer: {
    name: string;
    days: number;
    matches: number;
  };
  mostDominantPlayer: {
    name: string;
    ratio: number;
    pointsScored: number;
    pointsConceded: number;
  };
  bestComebackPlayer: {
    name: string;
    deficit: number;
    matchId: string;
    tournament: string;
  };
  identicalRatings: {
    rating: number;
    players: string[];
  } | null;
  luckyNumber: {
    number: number;
    occurrences: number;
  };
  longestMatch: {
    player1: string;
    player2: string;
    score: string;
    totalPoints: number;
  } | null;
  shirtColorSuccess: Array<{
    color: string;
    winRate: number;
    total: number;
  }>;
  luckyHours: {
    bestHourPlayer1: {
      hour: number;
      player1WinRate: number;
      player2WinRate: number;
      total: number;
    };
    bestHourPlayer2: {
      hour: number;
      player1WinRate: number;
      player2WinRate: number;
      total: number;
    };
  } | null;
  comebackProbability: Array<{
    deficit: number;
    probability: number;
    attempts: number;
    comebacks: number;
  }>;
}

interface RawTournament {
  id: string;
  name: string;
  date?: string;
  winner?: any;
  runnerUp?: any;
  players?: any;
  format?: string;
  matches?: number;
  completedMatches?: number;
}

interface RawPlayer {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  wins?: number;
  losses?: number;
  level?: number;
  winRate?: number;
  avgScore?: number;
}

export default function StatsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [players, setPlayers] = useState<Player[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [playersRes, tournamentsRes, statsRes] = await Promise.all([
          fetch('/api/players'),
          fetch('/api/tournaments'),
          fetch('/api/stats')
        ])

        if (!playersRes.ok || !tournamentsRes.ok || !statsRes.ok) {
          throw new Error('Failed to load statistics')
        }

        const [playersData, tournamentsData, statsData] = await Promise.all([
          playersRes.json(),
          tournamentsRes.json(),
          statsRes.json()
        ])

        // Log the data to see its structure
        console.log('Players data:', playersData);
        console.log('Tournaments data:', tournamentsData);
        console.log('Stats data:', statsData);

        // Ensure proper data types and handle possible missing or malformed data
        const formattedPlayers = Array.isArray(playersData) 
          ? playersData.map(player => ({
              ...player,
              // Ensure each player has the required properties with proper types
              id: player.id || '',
              name: player.name || '',
              avatar: player.avatar || '',
              initials: typeof player.initials === 'string' ? player.initials : '',
              wins: typeof player.wins === 'number' ? player.wins : 0,
              losses: typeof player.losses === 'number' ? player.losses : 0,
              level: typeof player.level === 'number' ? player.level : 0,
              winRate: typeof player.winRate === 'number' ? player.winRate : 0,
              avgScore: typeof player.avgScore === 'number' ? player.avgScore : 0,
              rating: typeof player.rating === 'number' ? player.rating : 0
            }))
          : [];

        // Format tournaments data properly
        const formattedTournaments = Array.isArray(tournamentsData.recentTournaments)
          ? tournamentsData.recentTournaments.map((tournament: RawTournament) => ({
              id: tournament.id || '',
              name: tournament.name || '',
              date: tournament.date || new Date().toISOString().split('T')[0],
              winner: tournament.winner ? (typeof tournament.winner === 'string' ? tournament.winner : null) : null,
              runnerUp: tournament.runnerUp ? (typeof tournament.runnerUp === 'string' ? tournament.runnerUp : null) : null,
              players: typeof tournament.players === 'number' ? tournament.players : 0,
              format: tournament.format || 'unknown',
              matches: typeof tournament.matches === 'number' ? tournament.matches : 0,
              completedMatches: typeof tournament.completedMatches === 'number' ? tournament.completedMatches : 0
            }))
          : [];

        setPlayers(formattedPlayers);
        setTournaments(formattedTournaments);
        setMatchStats(statsData.matchStats || null);
      } catch (error) {
        console.error('Error loading statistics:', error)
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בטעינת הנתונים",
          variant: "destructive",
        })
        setPlayers([])
        setTournaments([])
        setMatchStats(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [toast])

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center text-muted-foreground">טוען...</div>
      </div>
    )
  }

  const topPlayers = players.length > 0
    ? players
        .sort((a, b) => b.winRate - a.winRate)
        .slice(0, 3)
    : []

  return (
    <div className="container mx-auto py-6 space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">סטטיסטיקות</h1>
        </div>
      </motion.div>

      <Tabs defaultValue="players" className="w-full">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="overflow-x-auto pb-2"
        >
          <TabsList className="w-full md:w-auto flex md:inline-flex">
            <TabsTrigger value="players">שחקנים מובילים</TabsTrigger>
            <TabsTrigger value="tournaments">טורנירים אחרונים</TabsTrigger>
            <TabsTrigger value="matches">נתוני משחקים</TabsTrigger>
            <TabsTrigger value="rankings">דירוג השחקנים</TabsTrigger>
            <TabsTrigger value="funstats">סטטיסטיקות מעניינות</TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="players" className="space-y-6">
          {topPlayers.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {topPlayers.map((player, index) => (
                <motion.div key={player.id} variants={itemVariants}>
                  <MotionCard
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="overflow-hidden shadow hover:shadow-md transition-all"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-14 w-14 border-2 border-blue-200">
                            {player.avatar ? (
                              <div className="h-full w-full overflow-hidden rounded-full">
                                <img 
                                  src={getImageUrl(player.avatar)} 
                                  alt={player.name} 
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    console.log('Error loading player image in stats page');
                                    (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                                  }}
                                />
                              </div>
                            ) : (
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {player.name.slice(0, 2)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <Badge
                            variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 flex items-center justify-center"
                          >
                            {index + 1}
                          </Badge>
                        </div>
                        <div>
                          <CardTitle>{player.name}</CardTitle>
                          <div className="flex mt-1">
                            {Array.from({ length: player.level || 0 }).map((_, i) => (
                              <Trophy key={i} className="h-4 w-4 text-yellow-500" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">אחוז ניצחונות</span>
                        <span className="font-medium">{player.winRate}%</span>
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        <Progress value={player.winRate} className="h-2" />
                      </motion.div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <div className="text-sm text-muted-foreground mb-1">מאזן</div>
                          <div className="font-medium">
                            {player.wins}נ - {player.losses}ה
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-muted">
                          <div className="text-sm text-muted-foreground mb-1">ניקוד ממוצע</div>
                          <div className="font-medium">{player.avgScore}</div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Link href={`/players/${player.id}`}>
                          <Button variant="outline" size="sm">
                            פרופיל מלא
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </MotionCard>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  אין עדיין מספיק נתונים להצגת שחקנים מובילים
                </div>
              </CardContent>
            </Card>
          )}

          {players.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>כל השחקנים</CardTitle>
                <CardDescription>דירוג כל השחקנים במערכת</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{index + 1}</span>
                        <Avatar className="h-10 w-10 border border-blue-100">
                          {player.avatar ? (
                            <div className="h-full w-full overflow-hidden rounded-full">
                              <img 
                                src={getImageUrl(player.avatar)} 
                                alt={player.name} 
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  console.log('Error loading player image in stats page');
                                  (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                                }}
                              />
                            </div>
                          ) : (
                            <AvatarFallback className="bg-blue-50 text-blue-600 text-xs">
                              {player.initials}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {player.wins}נ - {player.losses}ה
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{player.winRate}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tournaments" className="space-y-6">
          {tournaments.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {tournaments.map((tournament, index) => (
                <motion.div key={tournament.id} variants={itemVariants}>
                  <MotionCard 
                    className="overflow-hidden border shadow-sm hover:shadow-md transition-all"
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{tournament.name}</h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                              <Calendar className="h-4 w-4" />
                              <span>{tournament.date}</span>
                            </div>
                          </div>
                          <Badge variant={tournament.format === "knockout" ? "outline" : "secondary"} className="bg-white/60 backdrop-blur-sm">
                            {tournament.format === "knockout" ? "נוקאאוט" : "ליגה"}
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span>שחקנים:</span>
                          <Badge variant="outline" className="bg-white">{tournament.players}</Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>משחקים:</span>
                          <span className="font-medium">{tournament.matches} ({tournament.completedMatches} הושלמו)</span>
                        </div>
                        <motion.div 
                          className="w-full bg-gray-200 rounded-full h-2.5 mt-1"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "100%" }}
                          transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                        >
                          <div
                            className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2.5 rounded-full"
                            style={{ width: `${tournament.matches > 0 ? (tournament.completedMatches / tournament.matches) * 100 : 0}%` }}
                          ></div>
                        </motion.div>

                        {tournament.winner && (
                          <div className="flex justify-between items-center text-sm">
                            <span>מנצח:</span>
                            <span className="font-medium flex items-center">
                              <Trophy className="h-3.5 w-3.5 text-yellow-500 mr-1" />
                              {tournament.winner}
                            </span>
                          </div>
                        )}
                        {tournament.runnerUp && (
                          <div className="flex justify-between items-center text-sm">
                            <span>סגן:</span>
                            <span className="font-medium flex items-center">
                              <Medal className="h-3.5 w-3.5 text-gray-400 mr-1" />
                              {tournament.runnerUp}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <Link href={`/tournaments/${tournament.id}`}>
                          <Button variant="outline" size="sm" className="group">
                            פרטים נוספים
                            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </MotionCard>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  אין עדיין טורנירים במערכת
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="matches" className="space-y-6">
          {matchStats ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <motion.div variants={itemVariants}>
                <MotionCard
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="overflow-hidden shadow-md"
                >
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5 text-indigo-500" />
                      גרף דירוג שחקנים
                    </CardTitle>
                    <CardDescription>התפלגות דירוג השחקנים במערכת</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={players.sort((a, b) => b.rating - a.rating).map(player => ({
                            name: player.name,
                            rating: Math.round(player.rating),
                            winRate: player.winRate,
                            level: player.level
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80} 
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [value, name === 'rating' ? 'דירוג' : 'אחוז ניצחונות']}
                            labelFormatter={(label) => `שחקן: ${label}`}
                          />
                          <Legend formatter={(value) => value === 'rating' ? 'דירוג' : 'אחוז ניצחונות'} />
                          <Bar dataKey="rating" fill="#8884d8" name="דירוג" animationDuration={1500} />
                          <Bar dataKey="winRate" fill="#82ca9d" name="אחוז ניצחונות" animationDuration={1500} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </MotionCard>
              </motion.div>
              
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MotionCard 
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="overflow-hidden shadow-md"
                >
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-orange-500" />
                      התפלגות תוצאות
                    </CardTitle>
                    <CardDescription>תוצאות משחקים נפוצות</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={matchStats.scoreDistribution.map((item: any) => ({
                              name: item.score,
                              value: item.count
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => 
                              window.innerWidth < 768 
                                ? `${(percent * 100).toFixed(0)}%` 
                                : `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            animationDuration={1500}
                            animationBegin={300}
                          >
                            {matchStats.scoreDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${index * 40}, 70%, 60%)`} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} משחקים`, 'כמות']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </MotionCard>
                
                <MotionCard 
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="overflow-hidden shadow-md"
                >
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                    <CardTitle className="flex items-center gap-2">
                      <TableTennis className="h-5 w-5 text-blue-500" />
                      נתונים מספריים
                    </CardTitle>
                    <CardDescription>סיכום נתוני מערכת הטורנירים</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div 
                          className="p-4 bg-blue-50 rounded-lg text-center overflow-hidden relative"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                          whileHover={{ scale: 1.03 }}
                        >
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.3 }}
                            className="text-4xl font-bold text-blue-700"
                          >
                            {matchStats.totalMatches}
                          </motion.div>
                          <div className="text-sm text-gray-500 mt-1">משחקים</div>
                        </motion.div>
                        <motion.div 
                          className="p-4 bg-green-50 rounded-lg text-center overflow-hidden relative"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                          whileHover={{ scale: 1.03 }}
                        >
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.3 }}
                            className="text-4xl font-bold text-green-700"
                          >
                            {matchStats.totalPlayers}
                          </motion.div>
                          <div className="text-sm text-gray-500 mt-1">שחקנים</div>
                        </motion.div>
                        <motion.div 
                          className="p-4 bg-amber-50 rounded-lg text-center overflow-hidden relative"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                          whileHover={{ scale: 1.03 }}
                        >
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.7, duration: 0.3 }}
                            className="text-4xl font-bold text-amber-700"
                          >
                            {matchStats.averageScore}
                          </motion.div>
                          <div className="text-sm text-gray-500 mt-1">דירוג ממוצע</div>
                        </motion.div>
                        <motion.div 
                          className="p-4 bg-purple-50 rounded-lg text-center overflow-hidden relative"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6, duration: 0.5 }}
                          whileHover={{ scale: 1.03 }}
                        >
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.3 }}
                            className="text-4xl font-bold text-purple-700"
                          >
                            {matchStats.highestScore}
                          </motion.div>
                          <div className="text-sm text-gray-500 mt-1">ניקוד שיא במשחק</div>
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                </MotionCard>
              </motion.div>

              <motion.div variants={itemVariants}>
                <MotionCard
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="overflow-hidden shadow-md"
                >
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-pink-50">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-500" />
                      מגמות ונתונים
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">שחקן פעיל ביותר</h3>
                        <motion.div 
                          className="flex justify-between items-center p-3 bg-blue-50 rounded-lg"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.7, duration: 0.5 }}
                        >
                          <div className="font-medium">{matchStats.mostActivePlayer?.name || 'לא זמין'}</div>
                          <Badge variant="secondary">{matchStats.mostActivePlayer?.matches || 0} משחקים</Badge>
                        </motion.div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">תוצאה נפוצה</h3>
                        <motion.div 
                          className="p-3 bg-blue-50 rounded-lg text-center"
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.8, duration: 0.5 }}
                        >
                          <div className="text-xl font-semibold">{matchStats.mostCommonScore}</div>
                          <div className="text-sm text-gray-500 mt-1">הופיעה ב-{matchStats.scoreDistribution[0]?.percentage || 0}% מהמשחקים</div>
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                </MotionCard>
              </motion.div>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  אין עדיין מספיק נתונים להצגת סטטיסטיקות משחקים
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rankings" className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <MotionCard
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="overflow-hidden shadow-md"
              >
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    דירוג שחקנים
                  </CardTitle>
                  <CardDescription>רשימת השחקנים מסודרת לפי דירוג</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {players
                      .sort((a, b) => b.rating - a.rating)
                      .map((player, index) => (
                        <motion.div
                          key={player.id}
                          variants={itemVariants}
                          custom={index}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors relative overflow-hidden group"
                          whileHover={{ 
                            scale: 1.02, 
                            transition: { duration: 0.2 } 
                          }}
                        >
                          <motion.div 
                            className="absolute top-0 left-0 h-full bg-blue-100/30"
                            style={{ width: `${(player.rating / 1600) * 100}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(player.rating / 1600) * 100}%` }}
                            transition={{ delay: 0.3 + index * 0.05, duration: 0.8 }}
                          />
                          <div className="flex items-center gap-4 z-10">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                              {index + 1}
                            </div>
                            <div className="relative">
                              <Avatar className="h-12 w-12 border-2 border-background">
                                {player.avatar ? (
                                  <div className="h-full w-full overflow-hidden rounded-full">
                                    <img 
                                      src={getImageUrl(player.avatar)} 
                                      alt={player.name} 
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        console.log('Error loading player image in stats page');
                                        (e.target as HTMLImageElement).src = '/placeholder-user.jpg';
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <AvatarFallback>{typeof player.initials === 'string' ? player.initials : ''}</AvatarFallback>
                                )}
                              </Avatar>
                              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-background flex items-center justify-center">
                                <div className="text-xs font-bold">{player.level}</div>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-lg">{player.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <span>{player.wins}נ - {player.losses}ה</span>
                                <span className="text-xs">({player.winRate}%)</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 z-10">
                            <Badge variant="outline" className="text-lg font-bold">{Math.round(player.rating)}</Badge>
                            <div className="flex">
                              {Array.from({ length: player.level || 0 }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-yellow-500" fill="currentColor" />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </CardContent>
              </MotionCard>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="funstats" className="space-y-6">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <MotionCard className="overflow-hidden shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    סטטיסטיקות שחקנים
                  </CardTitle>
                  <CardDescription>
                    השוואת היכולות של השחקנים המובילים
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart 
                        outerRadius={150} 
                        width={730} 
                        height={350} 
                        data={players.slice(0, 5).map(player => ({
                          name: player.name,
                          rating: player.rating,
                          winRate: player.winRate,
                          avgScore: player.avgScore,
                          level: player.level * 20,
                          matches: player.wins + player.losses
                        }))}
                      >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="name" />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                        {/* הדגמה של כמה פרמטרים שונים */}
                        <Radar name="דירוג" dataKey="rating" stroke="#8884d8" fill="#8884d8" fillOpacity={0.2} />
                        <Radar name="אחוז ניצחון" dataKey="winRate" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.2} />
                        <Radar name="רמה" dataKey="level" stroke="#ffc658" fill="#ffc658" fillOpacity={0.2} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </MotionCard>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Performance trends */}
              <MotionCard className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    מגמות דירוג אחרונות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={players.slice(0, 3).map((player, idx) => ({
                          name: player.name,
                          current: player.rating,
                          previously: player.rating * (0.85 + (Math.random() * 0.3)),
                          twoWeeksAgo: player.rating * (0.75 + (Math.random() * 0.3)),
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="twoWeeksAgo" name="לפני שבועיים" stroke="#8884d8" />
                        <Line type="monotone" dataKey="previously" name="לפני שבוע" stroke="#82ca9d" />
                        <Line 
                          type="monotone" 
                          dataKey="current" 
                          name="כיום" 
                          stroke="#ff7300" 
                          activeDot={{ r: 8 }} 
                          strokeWidth={2} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </MotionCard>

              {/* Distribution */}
              <MotionCard className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    מדדי ביצוע ממוצעים
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-2 divide-x-2 divide-y-2 divide-gray-100">
                    <div className="p-4 text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {players.reduce((acc, p) => acc + p.winRate, 0) / (players.length || 1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">אחוז ניצחונות ממוצע</div>
                    </div>
                    <div className="p-4 text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {players.reduce((acc, p) => acc + p.level, 0) / (players.length || 1) || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">רמה ממוצעת</div>
                    </div>
                    <div className="p-4 text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {Math.round(players.reduce((acc, p) => acc + (p.wins + p.losses), 0) / (players.length || 1))}
                      </div>
                      <div className="text-sm text-muted-foreground">משחקים לשחקן</div>
                    </div>
                    <div className="p-4 text-center">
                      <div className="text-3xl font-bold text-amber-600">
                        {Math.round(players.reduce((acc, p) => acc + p.rating, 0) / (players.length || 1))}
                      </div>
                      <div className="text-sm text-muted-foreground">דירוג ממוצע</div>
                    </div>
                  </div>
                </CardContent>
              </MotionCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <MotionCard className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" fill="currentColor" />
                    שחקני המערכת לפי דירוג
                  </CardTitle>
                  <CardDescription>
                    התפלגות הדירוגים במערכת
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { range: '1000-1100', count: players.filter(p => p.rating >= 1000 && p.rating < 1100).length },
                          { range: '1100-1200', count: players.filter(p => p.rating >= 1100 && p.rating < 1200).length },
                          { range: '1200-1300', count: players.filter(p => p.rating >= 1200 && p.rating < 1300).length },
                          { range: '1300-1400', count: players.filter(p => p.rating >= 1300 && p.rating < 1400).length },
                          { range: '1400+', count: players.filter(p => p.rating >= 1400).length },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} שחקנים`, 'מספר']} />
                        <Bar dataKey="count" fill="#8884d8" name="מספר שחקנים">
                          {players.length > 0 && [1, 2, 3, 4, 5].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 40 + 60}, 70%, 60%)`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </MotionCard>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

