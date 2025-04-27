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
import PaymentEvidenceUploader from "@/components/PaymentEvidenceUploader";

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
  const [paymentMethod, setPaymentMethod] = useState<'bit' | 'paybox'>('bit');
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
          paymentMethod: paymentMethod,
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
  
  // יצירת קישור ביט שיכלול את כל הפרטים הנדרשים
  const generateBitPaymentLink = () => {
    if (!tournament || !tournament.bitPaymentPhone || !tournament.price) return null;
    
    // וידוא שמספר הטלפון נקי מתווים מיוחדים
    const cleanPhone = tournament.bitPaymentPhone.replace(/[-\s]/g, '');
    
    // קישור רשמי לביט - פותח את האפליקציה ישירות
    return `https://bit.me/p/${cleanPhone}?am=${tournament.price}&rm=${encodeURIComponent(tournament.bitPaymentName || `טורניר ${tournament.name}`)}`;
  }

  // קישור לתשלום בביט
  const bitPaymentLink = tournament?.price && tournament?.bitPaymentPhone 
    ? generateBitPaymentLink() 
    : null;

  // קישור לתשלום בפייבוקס
  const payboxPaymentLink = tournament?.payboxPaymentLink || null;

  // פונקציה לאישור תשלום
  const confirmPayment = async (method: 'bit' | 'paybox') => {
    if (!registrationId) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/payment-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId,
          paymentMethod: method,
          paymentStatus: 'confirmed',
          paymentReference: `manual-${new Date().toISOString()}`,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }
      
      toast({
        title: "התשלום אושר",
        description: "ההרשמה לטורניר הושלמה בהצלחה!",
        variant: "default",
      });
      
      // מעבר לדף הטורניר
      setTimeout(() => {
        router.push(`/tournaments/${tournamentId}`);
      }, 2000);
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה באישור התשלום",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment process
  const processPayment = async (method: 'bit' | 'paybox') => {
    if (!registrationId) return;
    
    try {
      setIsSubmitting(true);
      
      if (method === 'bit') {
        // Open Bit payment link in new window
        if (bitPaymentLink) {
          // Store registration ID in localStorage for recovery
          localStorage.setItem('pendingRegistrationId', registrationId);
          
          const bitWindow = window.open(bitPaymentLink, '_blank');
          
          if (!bitWindow) {
            toast({
              title: "שגיאה בפתיחת קישור",
              description: "לא הצלחנו לפתוח את קישור התשלום. אנא אפשר חלונות קופצים או נסה שוב.",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
          
          // Ask the user if payment was completed - with clearer wording
          setTimeout(() => {
            const confirmed = confirm(
              "האם השלמת את התשלום בביט?\n\n" +
              "⚠️ חשוב: אישור תשלום שלא בוצע בפועל הוא עבירה על תנאי השימוש.\n\n" +
              "לחץ 'אישור' רק אם התשלום הושלם, או 'ביטול' אם טרם ביצעת את התשלום."
            );
            
            if (confirmed) {
              confirmPayment('bit');
            } else {
              toast({
                title: "תשלום לא הושלם",
                description: "תוכל להשלים את התשלום מאוחר יותר דרך הקישור שישלח במייל או באזור האישי",
                variant: "default",
              });
            }
          }, 10000); // Increased timeout to 10 seconds for better user experience
        } else {
          toast({
            title: "שגיאה",
            description: "לא ניתן ליצור קישור תשלום בביט. אנא פנה למנהל המערכת.",
            variant: "destructive",
          });
        }
      } else if (method === 'paybox') {
        // Open Paybox payment link in new window
        if (payboxPaymentLink) {
          // Store registration ID in localStorage for recovery
          localStorage.setItem('pendingRegistrationId', registrationId);
          
          const payboxWindow = window.open(payboxPaymentLink, '_blank');
          
          if (!payboxWindow) {
            toast({
              title: "שגיאה בפתיחת קישור",
              description: "לא הצלחנו לפתוח את קישור התשלום. אנא אפשר חלונות קופצים או נסה שוב.",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
          
          // Ask the user if payment was completed - with clearer wording
          setTimeout(() => {
            const confirmed = confirm(
              "האם השלמת את התשלום ב-Paybox?\n\n" +
              "⚠️ חשוב: אישור תשלום שלא בוצע בפועל הוא עבירה על תנאי השימוש.\n\n" +
              "לחץ 'אישור' רק אם התשלום הושלם, או 'ביטול' אם טרם ביצעת את התשלום."
            );
            
            if (confirmed) {
              confirmPayment('paybox');
            } else {
              toast({
                title: "תשלום לא הושלם",
                description: "תוכל להשלים את התשלום מאוחר יותר דרך הקישור שישלח במייל או באזור האישי",
                variant: "default",
              });
            }
          }, 10000); // Increased timeout to 10 seconds for better user experience
        } else {
          toast({
            title: "שגיאה",
            description: "לא קיים קישור תשלום בפייבוקס. אנא פנה למנהל המערכת.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעיבוד התשלום. אנא נסה שוב או פנה לתמיכה.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment selection
  const handlePaymentSelection = (method: 'bit' | 'paybox') => {
    setPaymentMethod(method);
    processPayment(method);
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
                  <p>כעת יש להשלים את התשלום על סך <span className="font-bold">{tournament.price}₪</span> באחת מהדרכים הבאות:</p>
                </div>
                
                <div className="grid gap-4">
                  <div className="flex flex-col space-y-3">
                    <h3 className="font-semibold text-gray-700">אפשרויות תשלום:</h3>
                    
                    {bitPaymentLink && (
                      <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">תשלום באמצעות ביט</h4>
                            <p className="text-sm text-gray-500">העברה פשוטה וקלה לטלפון {tournament.bitPaymentPhone}</p>
                            <div className="text-xs text-blue-600 mt-1">
                              שם: {tournament.bitPaymentName || `טורניר ${tournament.name}`}
                            </div>
                          </div>
                          <Button asChild variant="outline" className="bg-blue-50 hover:bg-blue-100">
                            <a 
                              href={bitPaymentLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center"
                              onClick={() => localStorage.setItem('pendingRegistrationId', registrationId || '')}
                            >
                              <img src="/bit-logo.png" alt="ביט" className="h-4 w-4 mr-2" />
                              שלם {tournament.price}₪
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {payboxPaymentLink && (
                      <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">תשלום באמצעות Paybox</h4>
                            <p className="text-sm text-gray-500">תשלום מאובטח דרך לינק Paybox</p>
                          </div>
                          <Button asChild variant="outline" className="bg-green-50 hover:bg-green-100">
                            <a 
                              href={payboxPaymentLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center"
                              onClick={() => localStorage.setItem('pendingRegistrationId', registrationId || '')}
                            >
                              שלם {tournament.price}₪
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        <span className="font-bold">⚠️ שים לב:</span> לאחר שביצעת את התשלום, לחץ על כפתור "אישור תשלום" להשלמת התהליך.
                        אישור זה הוא הצהרה שהתשלום אכן בוצע.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        variant="default" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handlePaymentSelection(paymentMethod)}
                      >
                        אישור תשלום
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => router.push(`/tournaments/${tournamentId}`)}
                      >
                        חזרה לדף הטורניר
                      </Button>
                    </div>
                    
                    {/* Option to upload payment evidence */}
                    <div className="mt-8">
                      <div className="text-sm text-gray-500 mb-2">
                        או לחלופין, אם כבר ביצעת תשלום ויש לך צילום מסך של האישור:
                      </div>
                      {registrationId && (
                        <PaymentEvidenceUploader 
                          registrationId={registrationId} 
                          onSuccess={() => {
                            toast({
                              title: "התקבלה הוכחת תשלום",
                              description: "הוכחת התשלום התקבלה בהצלחה ותיבדק בקרוב על ידי מנהל המערכת.",
                              variant: "default",
                            });
                            
                            setTimeout(() => {
                              router.push(`/tournaments/${tournamentId}`);
                            }, 3000);
                          }}
                        />
                      )}
                    </div>
                  </div>
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
                        <p className="font-medium">⚠️ חשוב:</p>
                        <p>תהליך ההרשמה כולל תשלום של {tournament.price}₪.</p>
                        <p>אישור ההרשמה מותנה בביצוע התשלום!</p>
                        
                        <div className="mt-3 space-y-2">
                          <div className="font-medium">בחר שיטת תשלום:</div>
                          <div className="flex gap-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={paymentMethod === 'bit'}
                                onChange={() => setPaymentMethod('bit')}
                                className="h-4 w-4 accent-blue-600"
                              />
                              <span>תשלום בביט</span>
                            </label>
                            
                            {tournament.payboxPaymentLink && (
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={paymentMethod === 'paybox'}
                                  onChange={() => setPaymentMethod('paybox')}
                                  className="h-4 w-4 accent-green-600"
                                />
                                <span>תשלום ב-Paybox</span>
                              </label>
                            )}
                          </div>
                        </div>
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