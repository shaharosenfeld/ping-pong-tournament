"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { CalendarDays, MapPin, Trophy, Users, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TournamentRegistrations } from "@/components/TournamentRegistrations";
import { useAuth } from "@/app/hooks/use-auth";

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
  registrationOpen: boolean;
}

export default function TournamentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tournamentId = pathname?.split('/').slice(-1)[0] || '';
  const initialTab = searchParams.get('tab') || 'info';
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const response = await fetch(`/api/tournaments/${tournamentId}`);
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
  }, [tournamentId, toast]);

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
    if (!tournament || !tournament.bitPaymentPhone || !tournament.price) return null;
    
    // ניקוי מספר הטלפון מתווים מיוחדים
    const cleanPhone = tournament.bitPaymentPhone.replace(/[-\s]/g, '');
    
    // יצירת ה-URL לתשלום בביט
    const paymentURL = `https://www.bitpay.co.il/he-il/p/?phone=${encodeURIComponent(cleanPhone)}&amount=${encodeURIComponent(tournament.price)}&name=${encodeURIComponent(tournament.bitPaymentName || tournament.name)}`;
    
    return paymentURL;
  }

  const bitPaymentLink = tournament?.price && tournament?.bitPaymentPhone 
    ? generateBitPaymentLink() 
    : null;

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
    <div style={{ direction: "rtl" }} className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">{tournament.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(tournament.status)}
          </div>
        </div>
        
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
      </div>
    </div>
  );
} 