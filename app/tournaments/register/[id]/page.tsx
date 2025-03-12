"use client"

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CalendarDays, MapPin, LoaderCircle, Trophy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Player {
  id: string;
  name: string;
  rating: number;
  email?: string;
  phone?: string;
}

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  location?: string;
  status: string;
  price?: number | null;
  bitPaymentPhone?: string | null;
  bitPaymentName?: string | null;
  registrationOpen: boolean;
  players: Player[];
}

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tournamentId = pathname?.split('/').slice(-1)[0] || '';
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // מביא את פרטי הטורניר
        const tournamentResponse = await fetch(`/api/tournaments/${tournamentId}`);
        
        if (!tournamentResponse.ok) {
          throw new Error('Failed to fetch tournament');
        }
        
        const tournamentData = await tournamentResponse.json();
        
        if (!tournamentData.registrationOpen) {
          toast({
            title: "ההרשמה סגורה",
            description: "ההרשמה לטורניר זה סגורה כרגע",
            variant: "destructive",
          });
          
          setTimeout(() => {
            router.push(`/tournaments/${tournamentId}`);
          }, 2000);
          return;
        }
        
        setTournament(tournamentData);
        
        // מביא את כל השחקנים במערכת
        const playersResponse = await fetch('/api/players');
        
        if (!playersResponse.ok) {
          throw new Error('Failed to fetch players');
        }
        
        const playersData = await playersResponse.json();
        setAllPlayers(playersData.players || []);
        
        // מסנן רק שחקנים שלא כבר רשומים לטורניר
        const tournamentPlayerIds = tournamentData.players.map((p: Player) => p.id);
        const filteredPlayers = playersData.players.filter((p: Player) => !tournamentPlayerIds.includes(p.id));
        
        setAvailablePlayers(filteredPlayers);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "שגיאה",
          description: "לא ניתן לטעון את הנתונים",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tournamentId, router, toast]);

  const handleRegistration = async () => {
    if (!selectedPlayerId) {
      toast({
        title: "שגיאה",
        description: "יש לבחור שחקן כדי להירשם",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // מוצא את השחקן שנבחר מהרשימה
      const selectedPlayer = allPlayers.find(p => p.id === selectedPlayerId);
      
      if (!selectedPlayer) {
        throw new Error('Player not found');
      }
      
      const response = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId,
          playerId: selectedPlayerId,
          name: selectedPlayer.name,
          email: selectedPlayer.email || 'unknown@example.com',
          phone: selectedPlayer.phone || '',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      toast({
        title: "ההרשמה הצליחה",
        description: "נרשמת בהצלחה לטורניר! אם נדרש תשלום, ניתן לשלם דרך ביט",
      });
      
      // אם יש קישור תשלום ביט - פותח אותו אוטומטית
      const bitPaymentLink = generateBitPaymentLink();
      if (bitPaymentLink) {
        window.open(bitPaymentLink, '_blank');
      }
      
      setTimeout(() => {
        router.push(`/tournaments/${tournamentId}`);
      }, 2000);
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשליחת טופס ההרשמה",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // יצירת קישור ביט שיכלול את כל הפרטים הנדרשים
  const generateBitPaymentLink = () => {
    if (!tournament || !tournament.bitPaymentPhone || !tournament.price) return null;
    
    const cleanPhone = tournament.bitPaymentPhone.replace(/[-\s]/g, '');
    const paymentURL = `https://www.bit.co.il/he-il/pay?phone=${encodeURIComponent(cleanPhone)}&amount=${encodeURIComponent(tournament.price)}&description=${encodeURIComponent(tournament.bitPaymentName || `הרשמה לטורניר ${tournament.name}`)}`;
    
    return paymentURL;
  }

  const bitPaymentLink = tournament?.price && tournament?.bitPaymentPhone 
    ? generateBitPaymentLink() 
    : null;

  if (isLoading) {
    return (
      <div className="container py-8" dir="rtl">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <LoaderCircle className="h-10 w-10 animate-spin mx-auto text-blue-600" />
          <p>טוען פרטי טורניר...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container py-8" dir="rtl">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <h2 className="text-xl font-bold">הטורניר לא נמצא</h2>
          <Link href="/tournaments" className="text-blue-600 hover:underline">
            חזרה לרשימת הטורנירים
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8" dir="rtl">
      <div className="max-w-lg mx-auto space-y-6">
        <Link href={`/tournaments/${tournamentId}`} className="text-blue-600 hover:underline flex items-center gap-1">
          &larr; חזרה לדף הטורניר
        </Link>
        
        <h1 className="text-2xl font-bold">הרשמה ל{tournament.name}</h1>
        
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{tournament.name}</CardTitle>
                {tournament.description && (
                  <CardDescription>{tournament.description}</CardDescription>
                )}
              </div>
              <Trophy className="h-8 w-8 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span>{new Date(tournament.startDate).toLocaleDateString("he-IL")}</span>
            </div>
            {tournament.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span>{tournament.location}</span>
              </div>
            )}
            {tournament.price && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span>מחיר: {tournament.price}₪</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
            <CardTitle className="flex items-center gap-2">
              <img src="/bit-logo.png" alt="ביט" className="h-6 w-6" /> 
              הרשמה מהירה
            </CardTitle>
            <CardDescription>בחר שחקן והירשם לטורניר</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {availablePlayers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                כל השחקנים כבר רשומים לטורניר זה. 
                <Link href="/players/new" className="text-blue-600 mx-1 hover:underline">צור שחקן חדש</Link>
                כדי להירשם.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">בחר שחקן</label>
                  <Select onValueChange={setSelectedPlayerId} value={selectedPlayerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר שחקן" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlayers.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name} (דירוג: {player.rating})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 bg-gradient-to-r from-blue-50 to-transparent pt-4">
            <Button 
              onClick={handleRegistration} 
              disabled={isSubmitting || availablePlayers.length === 0 || !selectedPlayerId}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                  שולח...
                </>
              ) : (
                "הירשם לטורניר"
              )}
            </Button>
            
            {bitPaymentLink && (
              <Button 
                variant="outline" 
                className="w-full sm:w-auto bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                asChild
              >
                <a href={bitPaymentLink} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <img src="/bit-logo.png" alt="ביט" className="h-4 w-4 mr-2" />
                  שלם {tournament.price}₪ בביט
                </a>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 