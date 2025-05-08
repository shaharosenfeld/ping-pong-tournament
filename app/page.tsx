"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Table, Users, BarChart, ArrowUpRight, Calendar, Star, Bot, Sparkles, Coins, Award, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "./hooks/use-auth"
import Image from "next/image"
import { motion } from "framer-motion"
import MobilePageLayout from './components/MobilePageLayout'
import MobileNavigation from './components/MobileNavigation'
import TournamentCard from './components/TournamentCard'
import { ToastContainer, ToastRef } from './components/ToastNotification'
import { addDays, subDays } from 'date-fns'

interface RecentTournament {
  id: string
  name: string
  date: string
  status: string
  format: string
  players: number
  matches: number
  completedMatches: number
  winner: string | null
  runnerUp: string | null
  price: number | null
  firstPlacePrize: string | null
  secondPlacePrize: string | null
  registrationOpen: boolean
}

interface Stats {
  activeTournaments: number
  upcomingMatches: number
  totalPlayers: number
  formatStats?: {
    knockout: number
    league: number
    groups: number
  }
  recentTournaments?: RecentTournament[]
}

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

const MotionCard = motion(Card);

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    activeTournaments: 0,
    upcomingMatches: 0,
    totalPlayers: 0,
  })
  const [latestTournament, setLatestTournament] = useState<RecentTournament | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [recentMatches, setRecentMatches] = useState<any[]>([])
  const { isAdmin } = useAuth()
  const toastRef = useRef<ToastRef>(null)
  
  // הוספת פונקציה לפורמט התאריך
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', { 
      day: 'numeric', 
      month: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // שיפור משמעותי: טעינה מקבילה של נתונים
        const [statsResponse, tournamentsResponse, matchesResponse] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/tournaments'),
          fetch('/api/matches')
        ])
        
        if (!statsResponse.ok || !tournamentsResponse.ok || !matchesResponse.ok) {
          throw new Error('אחת מהבקשות נכשלה')
        }
        
        const statsData = await statsResponse.json()
        const tournamentsData = await tournamentsResponse.json()
        const matchesData = await matchesResponse.json()
        
        setStats(statsData)
        
        // עיבוד הטורניר האחרון
        if (tournamentsData.tournaments && tournamentsData.tournaments.length > 0) {
          const sortedTournaments = [...tournamentsData.tournaments].sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          
          const latest = sortedTournaments[0]
          
          console.log("הטורניר האחרון:", latest)
          console.log("פרטי פרסים:", {
            price: latest.price,
            firstPlacePrize: latest.firstPlacePrize,
            secondPlacePrize: latest.secondPlacePrize,
            registrationOpen: latest.registrationOpen
          })
          
          setLatestTournament({
            id: latest.id,
            name: latest.name,
            date: formatDate(latest.startDate),
            format: latest.format,
            status: latest.status,
            matches: latest.matches.length,
            players: latest.players.length,
            completedMatches: latest.matches.filter((m: any) => m.status === 'completed').length,
            winner: null,
            runnerUp: null,
            price: latest.price,
            firstPlacePrize: latest.firstPlacePrize,
            secondPlacePrize: latest.secondPlacePrize,
            registrationOpen: latest.registrationOpen || false
          })
        }
        
        // עיבוד משחקים אחרונים
        if (matchesData && matchesData.length > 0) {
          const recent = matchesData
            .filter((match: any) => match.status === 'completed')
            .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5)
            
          setRecentMatches(recent)
        }
        
      } catch (error) {
        console.error("Error fetching homepage data:", error)
        toast({
          title: "שגיאה בטעינת נתונים",
          description: "אירעה שגיאה בעת טעינת נתוני דף הבית. נסה לרענן את העמוד.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // פונקציות עזר לתצוגה 
  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'knockout':
        return 'נוק-אאוט';
      case 'league':
        return 'ליגה';
      case 'groups':
        return 'בתים';
      default:
        return format;
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'עתידי';
      case 'active':
        return 'פעיל';
      case 'completed':
        return 'הסתיים';
      case 'canceled':
        return 'בוטל';
      default:
        return status;
    }
  };
  
  const getStatusVariant = (status: string): "default" | "secondary" | "outline" => {
    switch (status) {
      case 'upcoming':
        return 'outline';
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Demo tournaments
  const tournaments = [
    {
      id: '1',
      title: 'Summer Championship 2023',
      location: 'Central Sports Center, New York',
      date: addDays(new Date(), 15),
      participantsCount: 24,
      maxParticipants: 32,
      registrationDeadline: addDays(new Date(), 7),
      level: 'All Levels',
      prizePool: '$1,000',
      imageSrc: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80'
    },
    {
      id: '2',
      title: 'Weekly Club Tournament',
      location: 'Downtown Ping Pong Club',
      date: addDays(new Date(), 3),
      participantsCount: 16,
      maxParticipants: 16,
      registrationDeadline: subDays(new Date(), 1),
      level: 'Intermediate',
      imageSrc: 'https://images.unsplash.com/photo-1611251135345-18c56206de1e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80'
    },
    {
      id: '3',
      title: 'Professional Circuit - Round 4',
      location: 'National Sports Arena',
      date: addDays(new Date(), 30),
      participantsCount: 12,
      maxParticipants: 24,
      registrationDeadline: addDays(new Date(), 14),
      level: 'Advanced',
      prizePool: '$5,000',
      imageSrc: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80'
    },
    {
      id: '4',
      title: 'Youth Championship 2023',
      location: 'Community Center',
      date: subDays(new Date(), 5),
      participantsCount: 20,
      maxParticipants: 20,
      registrationDeadline: subDays(new Date(), 12),
      level: 'Beginner',
      imageSrc: 'https://images.unsplash.com/photo-1583500178450-e59e4309b57d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80'
    }
  ];
  
  // Show welcome toast on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (toastRef.current) {
        toastRef.current.showToast('Welcome to Ping Pong Tournament App!', 'info', 5000);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Tabs for the tournament filter
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Filter tournaments based on active tab
  const filteredTournaments = tournaments.filter(tournament => {
    if (activeTab === 'upcoming') {
      return new Date(tournament.date) > new Date();
    } else if (activeTab === 'past') {
      return new Date(tournament.date) < new Date();
    }
    return true;
  });

  return (
    <div className="bg-gray-50 min-h-screen pb-safe">
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* Page Layout */}
      <MobilePageLayout 
        title="Ping Pong Tournaments"
        subtitle="Find and join tournaments"
      >
        {/* Hero section */}
        <motion.div 
          className="mb-6 rounded-xl overflow-hidden relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div 
            className="h-48 bg-gradient-to-r from-blue-600 to-blue-400 relative"
          >
            <div className="absolute inset-0 bg-black bg-opacity-20" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <h1 className="text-white text-2xl font-bold">Play. Compete. Win.</h1>
              <p className="text-white text-sm mt-2 opacity-90">Join tournaments and track your ping pong journey.</p>
              
              <motion.button 
                className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium text-sm shadow-lg inline-flex items-center justify-center touch-target"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (toastRef.current) {
                    toastRef.current.showToast('Feature coming soon!', 'info');
                  }
                }}
              >
                Get Started
              </motion.button>
            </div>
          </div>
        </motion.div>
        
        {/* Tournament filter tabs */}
        <div className="mb-4 border-b pb-2">
          <div className="flex space-x-2 overflow-x-auto ios-scroll hide-scrollbar">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap touch-target ${
                activeTab === 'upcoming'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Upcoming Tournaments
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap touch-target ${
                activeTab === 'past'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Past Tournaments
            </button>
            <button
              onClick={() => {
                if (toastRef.current) {
                  toastRef.current.showToast('My Tournaments feature coming soon!', 'info');
                }
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-gray-100 text-gray-700 touch-target"
            >
              My Tournaments
            </button>
          </div>
        </div>
        
        {/* Tournament list */}
        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredTournaments.length === 0 ? (
            <motion.div 
              className="p-8 text-center text-gray-500"
              variants={itemVariants}
            >
              No tournaments found.
            </motion.div>
          ) : (
            filteredTournaments.map((tournament, index) => (
              <TournamentCard
                key={tournament.id}
                index={index}
                id={tournament.id}
                title={tournament.title}
                location={tournament.location}
                date={tournament.date}
                participantsCount={tournament.participantsCount}
                maxParticipants={tournament.maxParticipants}
                registrationDeadline={tournament.registrationDeadline}
                level={tournament.level as any}
                prizePool={tournament.prizePool}
                imageSrc={tournament.imageSrc}
              />
            ))
          )}
        </motion.div>
      </MobilePageLayout>
      
      {/* Toast Container for notifications */}
      <ToastContainer ref={toastRef} position="bottom-center" />
    </div>
  )
}

