"use client"

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CalendarDays, MapPin, LoaderCircle, Trophy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SelectGroup } from "@/components/ui/select";
import { ChevronRight } from "lucide-react";
import PaymentEvidenceUploader from "@/app/components/PaymentEvidenceUploader";
import PaymentMethodSelector from "@/app/components/PaymentMethodSelector";

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
  payboxPaymentLink?: string | null;
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
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
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
        description: "אנא בחר שחקן כדי להירשם",
        variant: "destructive",
      });
      return;
    }
    
    if (tournament?.price && tournament?.price > 0) {
      // אימות שהמשתמש מודע לחובת התשלום
      const confirmPayment = confirm(
        `ברישום לטורניר זה נדרש תשלום של ${tournament.price}₪.\n` +
        `המשך הרישום מהווה התחייבות לתשלום.\n` +
        `האם להמשיך?`
      );
      
      if (!confirmPayment) {
        return;
      }
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
      
      const data = await response.json();
      setRegistrationId(data.registration.id);
      
      if (tournament?.price && tournament?.price > 0) {
        toast({
          title: "ההרשמה בוצעה בהצלחה",
          description: "כעת יש להשלים את התשלום על מנת להשלים את תהליך ההרשמה.",
          variant: "default",
        });
        
        // מציג את אפשרויות התשלום
        setShowPaymentOptions(true);
        setIsSubmitting(false);
      } else {
        toast({
          title: "ההרשמה הצליחה",
          description: "נרשמת בהצלחה! אישור ההרשמה יישלח למייל לאחר אישור ידני ע\"י המנהל.",
        });
        
        // אם אין תשלום, נעבור לדף הטורניר
        setTimeout(() => {
          router.push(`/tournaments/${tournamentId}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשליחת טופס ההרשמה",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // Handle payment completion
  const handlePaymentComplete = () => {
    setTimeout(() => {
      router.push(`/tournaments/${tournamentId}`);
    }, 3000);
  };

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
      <div className="max-w-xl mx-auto">
        <Link
          href={`/tournaments/${tournamentId}`}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ChevronRight className="h-4 w-4 ml-1" />
          חזרה לדף הטורניר
        </Link>

        <Card className="shadow-lg border-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-2">
            <CardTitle className="text-2xl font-bold text-blue-800">{tournament?.name || 'טורניר'}</CardTitle>
            <CardDescription className="text-blue-600">
              הרשמה לטורניר
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {/* תצוגה של אפשרויות תשלום לאחר רישום */}
            {showPaymentOptions && tournament?.price && tournament?.price > 0 ? (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                  <h3 className="font-bold text-lg mb-2">ההרשמה בוצעה בהצלחה! 🎉</h3>
                  <p>כעת יש להשלים את התשלום על סך <span className="font-bold">{tournament.price}₪</span></p>
                </div>
                
                {/* Modern Payment Method Selector */}
                {registrationId && (
                  <PaymentMethodSelector
                    registrationId={registrationId}
                    tournamentId={tournamentId}
                    amount={tournament.price || 0}
                    bitPaymentPhone={tournament.bitPaymentPhone}
                    bitPaymentName={tournament.bitPaymentName}
                    payboxPaymentLink={tournament.payboxPaymentLink}
                    onSuccess={handlePaymentComplete}
                  />
                )}
                
                <div className="border-t pt-4 mt-4">
                  <div className="text-sm text-gray-500 mb-4">
                    אם כבר ביצעת תשלום במערכת חיצונית ויש לך צילום מסך/אסמכתא:
                  </div>
                  {registrationId && (
                    <PaymentEvidenceUploader 
                      registrationId={registrationId} 
                      onSuccess={handlePaymentComplete}
                    />
                  )}
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/tournaments/${tournamentId}`)}
                    className="w-full"
                  >
                    חזרה לדף הטורניר
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {availablePlayers.length === 0 && !isLoading ? (
                  <div className="text-center p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-2">אין שחקנים זמינים להרשמה</h3>
                    <p className="text-sm text-yellow-700">כל השחקנים שלך כבר רשומים לטורניר זה או שאין לך שחקנים.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      asChild
                    >
                      <Link href="/players/new">
                        צור שחקן חדש
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="player-select">בחר שחקן</Label>
                      <Select
                        value={selectedPlayerId}
                        onValueChange={setSelectedPlayerId}
                        disabled={isLoading || availablePlayers.length === 0}
                      >
                        <SelectTrigger id="player-select">
                          <SelectValue placeholder="בחר שחקן להרשמה" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {availablePlayers.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {player.name} {player.rating ? `(${player.rating})` : ''}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {tournament?.price && tournament?.price > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm">
                        <p className="font-medium">💰 עלות השתתפות:</p>
                        <p className="text-lg font-bold">{tournament.price}₪</p>
                        <p className="mt-2">התשלום יבוצע בשלב הבא, לאחר אישור ההרשמה.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4 bg-gradient-to-r from-blue-50 to-transparent pt-4">
            {!showPaymentOptions && (
              <div className="w-full">
                <Button 
                  onClick={handleRegistration} 
                  disabled={isSubmitting || availablePlayers.length === 0 || !selectedPlayerId}
                  className="w-full"
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
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 