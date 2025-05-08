"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { CalendarDays, MapPin, Trophy, Users, DollarSign, CreditCard, Share2, Bookmark, ArrowLeft, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TournamentRegistrations } from "@/components/TournamentRegistrations";
import { useAuth } from "@/app/hooks/use-auth";
import { motion, AnimatePresence } from 'framer-motion';
import { addDays, format, isBefore, isAfter } from 'date-fns';
import MobilePageLayout from '@/app/components/MobilePageLayout';
import { ToastContainer, ToastRef } from '@/app/components/ToastNotification';

interface Player {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  level?: number;
  wins?: number;
  losses?: number;
}

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  location?: string;
  status: string;
  players: Player[];
  price?: number | null;
  bitPaymentPhone?: string | null;
  bitPaymentName?: string | null;
  payboxPaymentLink?: string | null;
  registrationOpen: boolean;
  imageSrc?: string;
  level?: string;
}

export default function TournamentDetailsPage() {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'info';
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const toastRef = useRef<ToastRef>(null);
  
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const response = await fetch(`/api/tournaments/${id}`);
        if (!response.ok) throw new Error('Failed to fetch tournament');
        const data = await response.json();
        setTournament(data);
      } catch (error) {
        console.error('Error fetching tournament:', error);
        toast({
          title: "שגיאה",
          description: "לא ניתן לטעון את פרטי הטורניר",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournament();
  }, [id, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-gray-500">טיוטה</Badge>
      case "active":
        return <Badge className="bg-green-500">פעיל</Badge>
      case "completed":
        return <Badge className="bg-blue-500">הסתיים</Badge>
      default:
        return null
    }
  }
  
  // יצירת קישור ביט שיכלול את כל הפרטים הנדרשים
  const generateBitPaymentLink = () => {
    if (!tournament?.bitPaymentPhone || !tournament?.price) return null;
    
    // וידוא שמספר הטלפון נקי מתווים מיוחדים
    const cleanPhone = tournament.bitPaymentPhone.replace(/[-\s]/g, '');
    
    // יצירת קישור פשוט לביט - שיטה זו פותחת את אפליקציית ביט ומגדירה מראש את הפרטים
    return `https://www.bit.ly/a/payment?phone=${encodeURIComponent(cleanPhone)}&amount=${encodeURIComponent(tournament.price)}&name=${encodeURIComponent(tournament.bitPaymentName || `טורניר ${tournament.name}`)}`;
  }

  const bitPaymentLink = tournament?.price && tournament?.bitPaymentPhone 
    ? generateBitPaymentLink() 
    : null;
    
  const payboxPaymentLink = tournament?.payboxPaymentLink || null;

  const isRegistrationClosed = isBefore(new Date(tournament?.endDate || ''), new Date());
  const isPastTournament = isBefore(new Date(tournament?.startDate || ''), new Date());
  const isUpcoming = isAfter(new Date(tournament?.startDate || ''), new Date());
  
  // Register/unregister handler
  const handleRegistration = () => {
    if (tournament?.registrationOpen) {
      // Unregister logic
      setTournament(prev => ({ ...prev!, registrationOpen: false }));
      toastRef.current?.showToast('You have been unregistered from the tournament', 'info');
    } else {
      // Register logic
      setTournament(prev => ({ ...prev!, registrationOpen: true }));
      toastRef.current?.showToast('You have successfully registered for the tournament!', 'success');
    }
  };
  
  // Share tournament
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: tournament?.name || '',
        text: `Check out this ping pong tournament: ${tournament?.name || ''}`,
        url: window.location.href,
      })
      .then(() => toastRef.current?.showToast('Tournament shared successfully!', 'success'))
      .catch(() => toastRef.current?.showToast('Error sharing tournament', 'error'));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => toastRef.current?.showToast('Tournament link copied to clipboard!', 'success'))
        .catch(() => toastRef.current?.showToast('Error copying link', 'error'));
    }
  };
  
  // Animation variants
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  if (isLoading) {
    return <div className="container py-8 text-center">טוען...</div>;
  }

  if (!tournament) {
    return (
      <div className="container py-8 text-center">
        <div>הטורניר לא נמצא</div>
        <Link href="/tournaments">חזרה לרשימת הטורנירים</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-safe">
      <MobilePageLayout
        onBack={() => window.history.back()}
        title={tournament.name}
        subtitle={`${format(new Date(tournament.startDate), 'MMM d, yyyy')}`}
        footer={
          <div className="flex justify-between items-center">
            {!isPastTournament && (
              <motion.button
                className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                  !tournament.registrationOpen ? 'bg-red-100 text-red-600' : 'bg-primary text-white'
                }`}
                whileTap={{ scale: 0.98 }}
                onClick={handleRegistration}
                disabled={isRegistrationClosed || tournament.players.length >= 32}
              >
                {tournament.registrationOpen ? 'Unregister' : 'Register Now'}
              </motion.button>
            )}
            
            <motion.button
              className="ml-3 p-3 rounded-lg bg-gray-100"
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
            >
              <Share2 size={20} className="text-gray-700" />
            </motion.button>
            
            <motion.button
              className="ml-3 p-3 rounded-lg bg-gray-100"
              whileTap={{ scale: 0.95 }}
              onClick={() => toastRef.current?.showToast('Tournament saved!', 'success')}
            >
              <Bookmark size={20} className="text-gray-700" />
            </motion.button>
          </div>
        }
      >
        {/* Hero Image */}
        <div className="relative -mx-4 -mt-4 mb-6">
          <div 
            className="h-64 bg-gradient-to-r from-blue-600 to-blue-400 relative"
            style={tournament.imageSrc ? { 
              backgroundImage: `url(${tournament.imageSrc})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center' 
            } : {}}
          >
            <div className="absolute inset-0 bg-black bg-opacity-30" />
            
            {/* Status badge */}
            <div className="absolute top-4 right-4 py-1 px-3 rounded-full text-sm font-medium bg-black bg-opacity-50 text-white backdrop-blur-sm">
              {isPastTournament ? 'Completed' : 
               isRegistrationClosed ? 'Registration Closed' : 
               tournament.players.length >= 32 ? 'Full' : 'Registration Open'}
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-6 border-b">
          <div className="flex space-x-1 overflow-x-auto ios-scroll hide-scrollbar">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap touch-target ${
                activeTab === 'info'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap touch-target ${
                activeTab === 'players'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Participants ({tournament.players.length})
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap touch-target ${
                activeTab === 'matches'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Matches
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap touch-target ${
                activeTab === 'standings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Standings
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap touch-target ${
                activeTab === 'registrations'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Registrations
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'info' && (
            <motion.div
              key="info"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CalendarDays size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Date & Time</h3>
                    <p className="text-sm text-gray-600">{format(new Date(tournament.startDate), 'EEEE, MMMM d, yyyy')}</p>
                    <p className="text-sm text-gray-600">{tournament.startDate} - {tournament.endDate}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPin size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Location</h3>
                    <p className="text-sm text-gray-600">{tournament.location}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Users size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Participants</h3>
                    <p className="text-sm text-gray-600">
                      {tournament.players.length}/{32} participants
                    </p>
                    <p className="text-sm text-gray-600">Level: {tournament.level || 'All Levels'}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Trophy size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Format & Prizes</h3>
                    <p className="text-sm text-gray-600">{tournament.format}</p>
                    {tournament.price && (
                      <p className="text-sm text-gray-600">Entry fee: {tournament.price}₪</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Registration Deadline</h3>
                    <p className="text-sm text-gray-600">{format(new Date(tournament.endDate), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clipboard size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p className="text-sm text-gray-600">{tournament.description}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'players' && (
            <motion.div
              key="players"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="grid grid-cols-1 gap-3">
                {tournament.players.map((player) => (
                  <div 
                    key={player.id}
                    className="flex items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
                  >
                    <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                      <img 
                        src={player.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 100) + 10}`} 
                        alt={player.name} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{player.name}</p>
                      <p className="text-xs text-gray-500">
                        Record: <span className="text-green-600">{player.wins}W</span> - <span className="text-red-600">{player.losses}L</span>
                      </p>
                    </div>
                    <button 
                      className="p-2 text-gray-400 hover:text-gray-600"
                      onClick={() => toastRef.current?.showToast('Profile view coming soon!', 'info')}
                    >
                      <User size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          
          {activeTab === 'matches' && (
            <motion.div
              key="matches"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="space-y-3">
        <div className="flex">
          <Link href="/tournaments">
            <Button variant="outline" size="sm">חזרה לרשימת הטורנירים</Button>
          </Link>
        </div>
      </div>

      <Tabs 
        defaultValue={activeTab} 
        className="mt-6" 
        onValueChange={(value) => {
          setActiveTab(value);
          // עדכון ה-URL עם הטאב החדש
          const newParams = new URLSearchParams(searchParams);
          newParams.set('tab', value);
          router.push(`${pathname}?${newParams.toString()}`);
        }}
      >
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="info">מידע</TabsTrigger>
          <TabsTrigger value="players">שחקנים</TabsTrigger>
          <TabsTrigger value="matches">משחקים</TabsTrigger>
          <TabsTrigger value="standings">טבלה</TabsTrigger>
          <TabsTrigger value="registrations">הרשמות</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <Card className="border-2 border-blue-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
              <CardTitle className="text-lg sm:text-xl text-blue-800">פרטי הטורניר</CardTitle>
              {tournament.description && (
                <CardDescription className="text-blue-600">{tournament.description}</CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-2 text-blue-700">
                <CalendarDays className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm sm:text-base">
                  {new Date(tournament.startDate).toLocaleDateString("he-IL")}
                  {tournament.endDate && ` - ${new Date(tournament.endDate).toLocaleDateString("he-IL")}`}
                </span>
              </div>
              
              {tournament.location && (
                <div className="flex items-center gap-2 text-blue-700">
                  <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base truncate">{tournament.location}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-blue-700">
                <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm sm:text-base">
                  {tournament.players?.length || 0} שחקנים
                </span>
              </div>
              
              {tournament.price && (
                <div className="flex items-center gap-2 text-blue-700">
                  <DollarSign className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base">
                    מחיר השתתפות: {tournament.price}₪
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="players">
          <Card className="border-2 border-blue-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
              <CardTitle className="text-lg sm:text-xl text-blue-800">שחקנים ({tournament.players.length})</CardTitle>
            </CardHeader>
            
            <CardContent className="pt-4">
              {tournament.players.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tournament.players.map((player) => (
                    <div key={player.id} className="border rounded-lg p-4 flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-800 rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                        {player.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <div className="font-medium">{player.name}</div>
                        {(player.wins !== undefined && player.losses !== undefined) && (
                          <div className="text-sm text-gray-500">
                            <span className="text-green-500">{player.wins}W</span>
                            {" / "}
                            <span className="text-red-500">{player.losses}L</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">אין שחקנים רשומים בטורניר זה</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="registrations" className="mt-6">
          <TournamentRegistrations 
            tournamentId={tournamentId} 
            isAdmin={isAdmin}
            onRegistrationsChange={() => {
              // רענון נתוני הטורניר לאחר שינוי הרשמות
              setIsLoading(true);
              fetch(`/api/tournaments/${tournamentId}`)
                .then(res => res.json())
                .then(data => {
                  setTournament(data);
                  setIsLoading(false);
                })
                .catch(err => {
                  console.error('Error refreshing tournament data:', err);
                  setIsLoading(false);
                });
            }}
          />
        </TabsContent>
      </Tabs>
      
      {/* כפתורים להרשמה או תשלום */}
      <div className="flex flex-wrap justify-center gap-4 mt-8">
        {tournament.registrationOpen && (
          <Button asChild>
            <Link href={`/tournaments/register/${tournamentId}`}>
              הירשם לטורניר
            </Link>
          </Button>
        )}
        
        {bitPaymentLink && (
          <Button asChild variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
            <a href={bitPaymentLink} target="_blank" rel="noopener noreferrer">
              <DollarSign className="h-4 w-4 mr-1" />
              שלם {tournament.price}₪ בביט
            </a>
          </Button>
        )}
        
        {payboxPaymentLink && (
          <Button asChild variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
            <a href={payboxPaymentLink} target="_blank" rel="noopener noreferrer">
              <CreditCard className="h-4 w-4 mr-1" />
              שלם {tournament.price}₪ ב-Paybox
            </a>
          </Button>
        )}
      </div>
    </div>
  );
} 