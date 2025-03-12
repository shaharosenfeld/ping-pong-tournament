"use client"

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, DollarSign, Trophy, Check, CalendarIcon, MapPinIcon, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import Link from "next/link";

interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  price: number | null;
  firstPlacePrize: string | null;
  secondPlacePrize: string | null;
  bitPaymentPhone: string | null;
  bitPaymentName: string | null;
  registrationOpen: boolean;
  registrationDeadline: string | null;
}

interface RegistrationForm {
  name: string;
  phone: string;
  email: string;
  paymentReference?: string;
}

export default function RegisterTournamentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bit" | "cash">("bit");
  const { toast } = useToast();
  
  // מיצוי מזהה הטורניר מהנתיב
  const tournamentId = pathname?.split('/').slice(-1)[0] || '';
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegistrationForm>();
  
  useEffect(() => {
    const fetchTournament = async () => {
      if (!tournamentId) {
        router.push('/tournaments');
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/tournaments/${tournamentId}`);
        
        if (!response.ok) throw new Error('Failed to fetch tournament');
        
        const data = await response.json();
        setTournament(data);
        
        // בדיקה אם ההרשמה פתוחה
        if (!data.registrationOpen) {
          toast({
            title: "ההרשמה סגורה",
            description: "ההרשמה לטורניר זה סגורה כרגע",
            variant: "destructive",
          });
          router.push(`/tournaments/${tournamentId}`);
        }
        
      } catch (error) {
        console.error('Error fetching tournament:', error);
        toast({
          title: "שגיאה",
          description: "לא ניתן לטעון את פרטי הטורניר",
          variant: "destructive",
        });
        router.push('/tournaments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournament();
  }, [tournamentId, router, toast]);

  // יצירת קישור לתשלום בביט
  const generateBitPaymentLink = () => {
    if (!tournament || !tournament.bitPaymentPhone || !tournament.price) return null;
    
    // ניקוי מספר הטלפון מתווים מיוחדים
    const cleanPhone = tournament.bitPaymentPhone.replace(/[-\s]/g, '');
    
    // יצירת ה-URL לתשלום בביט
    const paymentURL = `https://www.bitpay.co.il/he-il/p/?phone=${encodeURIComponent(cleanPhone)}&amount=${encodeURIComponent(tournament.price)}&name=${encodeURIComponent(tournament.bitPaymentName || tournament.name)}`;
    
    return paymentURL;
  };

  const onSubmit = async (data: RegistrationForm) => {
    setIsSubmitting(true);
    
    try {
      // הוספת פרטים נוספים לטופס
      const registrationData = {
        ...data,
        tournamentId,
        paymentMethod,
        paymentStatus: paymentMethod === "bit" ? "pending" : "unpaid", // אם תשלום בביט, אז בהמתנה לאישור
        registrationDate: new Date().toISOString()
      };
      
      // שליחת הטופס ל-API
      const response = await fetch('/api/tournament-registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בהרשמה לטורניר');
      }
      
      // נוצרה הרשמה בהצלחה
      toast({
        title: "ההרשמה התקבלה בהצלחה",
        description: paymentMethod === "bit" 
          ? "תודה! לאחר ביצוע התשלום בביט, המנהל יאשר את השתתפותך" 
          : "תודה! המנהל יאשר את השתתפותך לאחר התשלום",
      });
      
      // הפניה לדף הטורניר או לדף תשלום בהתאם לבחירה
      if (paymentMethod === "bit") {
        const bitLink = generateBitPaymentLink();
        if (bitLink) {
          // פתיחת חלון חדש לתשלום בביט
          window.open(bitLink, '_blank');
        }
      }
      
      // הפניה חזרה לדף הטורניר
      router.push(`/tournaments/${tournamentId}?registered=true`);
      
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "שגיאה בהרשמה",
        description: error instanceof Error ? error.message : "אירעה שגיאה בהרשמה לטורניר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">טוען פרטי טורניר...</p>
        </div>
      </div>
    );
  }
  
  if (!tournament) {
    return (
      <div className="container py-12">
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg">הטורניר לא נמצא</p>
          <Button asChild>
            <Link href="/tournaments">חזרה לרשימת הטורנירים</Link>
          </Button>
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
        
        <Card className="border-2 border-blue-100 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
            <CardTitle className="text-blue-800 text-xl flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-600" />
              הרשמה לטורניר {tournament.name}
            </CardTitle>
            <CardDescription>
              אנא מלא את הפרטים להרשמה לטורניר
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* מידע על הטורניר */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <h3 className="font-medium">פרטי הטורניר:</h3>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-blue-500" />
                  <span>
                    {new Date(tournament.startDate).toLocaleDateString('he-IL')}
                    {tournament.endDate && ` - ${new Date(tournament.endDate).toLocaleDateString('he-IL')}`}
                  </span>
                </div>
                
                {tournament.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPinIcon className="h-4 w-4 text-blue-500" />
                    <span>{tournament.location}</span>
                  </div>
                )}
                
                {tournament.price && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                    <span>מחיר השתתפות: {tournament.price}₪</span>
                  </div>
                )}
              </div>
              
              {/* טופס הרשמה */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">שם מלא *</Label>
                  <Input
                    id="name"
                    placeholder="הזן את שמך המלא"
                    {...register("name", { required: "נא להזין שם מלא" })}
                    className="border-blue-200"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון נייד *</Label>
                  <Input
                    id="phone"
                    placeholder="הזן מספר טלפון"
                    {...register("phone", { 
                      required: "נא להזין מספר טלפון",
                      pattern: {
                        value: /^0\d{8,9}$/,
                        message: "נא להזין מספר טלפון תקין"
                      }
                    })}
                    className="border-blue-200"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm">{errors.phone.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">דוא"ל *</Label>
                  <Input
                    id="email"
                    placeholder="הזן כתובת דוא"ל"
                    type="email"
                    {...register("email", { 
                      required: "נא להזין כתובת דוא\"ל",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "כתובת דוא\"ל לא תקינה"
                      }
                    })}
                    className="border-blue-200"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email.message}</p>
                  )}
                </div>
                
                {tournament.price && tournament.price > 0 && (
                  <div className="space-y-3">
                    <Label>אופן תשלום</Label>
                    <Tabs 
                      value={paymentMethod} 
                      onValueChange={(value) => setPaymentMethod(value as "bit" | "cash")}
                      className="border-blue-100"
                    >
                      <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="bit" className="data-[state=active]:bg-blue-100">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>תשלום בביט</span>
                          </div>
                        </TabsTrigger>
                        <TabsTrigger value="cash" className="data-[state=active]:bg-blue-100">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>תשלום במזומן</span>
                          </div>
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="bit" className="pt-2">
                        <div className="bg-blue-50 p-3 rounded-md text-sm">
                          <p>לאחר ההרשמה תועבר לתשלום בביט. ההרשמה תאושר לאחר אימות התשלום.</p>
                          {tournament.bitPaymentPhone && (
                            <p className="mt-1">התשלום יבוצע למספר: {tournament.bitPaymentPhone}</p>
                          )}
                        </div>
                        
                        <div className="mt-3">
                          <Label htmlFor="paymentReference">אסמכתא/הערה לתשלום (אופציונלי)</Label>
                          <Input
                            id="paymentReference"
                            placeholder="הזן הערה שתופיע בתשלום"
                            {...register("paymentReference")}
                            className="border-blue-200 mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">הערה שתופיע באפליקציית ביט בעת התשלום</p>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="cash" className="pt-2">
                        <div className="bg-yellow-50 p-3 rounded-md text-sm border border-yellow-100">
                          <p>התשלום יתבצע במזומן ביום התחרות. שים לב כי מקומך אינו מובטח עד לביצוע התשלום.</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>מבצע הרשמה...</span>
                    </div>
                  ) : (
                    <span>הירשם לטורניר</span>
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 