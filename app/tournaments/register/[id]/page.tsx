"use client"

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CalendarDays, MapPin, LoaderCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface RegistrationFormData {
  name: string;
  email: string;
  phone: string;
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
}

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tournamentId = pathname?.split('/').slice(-1)[0] || '';
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<RegistrationFormData>();

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/tournaments/${tournamentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch tournament');
        }
        
        const data = await response.json();
        
        if (!data.registrationOpen) {
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
  }, [tournamentId, router, toast]);

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/tournament-registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          tournamentId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      toast({
        title: "ההרשמה הצליחה",
        description: "פרטי ההרשמה שלך נשלחו בהצלחה",
      });
      
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
    const paymentURL = `https://www.bitpay.co.il/he-il/p/?phone=${encodeURIComponent(cleanPhone)}&amount=${encodeURIComponent(tournament.price)}&name=${encodeURIComponent(tournament.bitPaymentName || tournament.name)}`;
    
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
          <CardHeader>
            <CardTitle>פרטי הטורניר</CardTitle>
            {tournament.description && (
              <CardDescription>{tournament.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-500" />
              <span>תאריך: {new Date(tournament.startDate).toLocaleDateString("he-IL")}</span>
            </div>
            {tournament.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>מיקום: {tournament.location}</span>
              </div>
            )}
            {tournament.price && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span>מחיר: {tournament.price}₪</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>טופס הרשמה</CardTitle>
            <CardDescription>אנא מלא את הפרטים הבאים</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="registration-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">שם מלא *</Label>
                <Input
                  id="name"
                  placeholder="שם מלא"
                  {...register("name", { required: "שדה חובה" })}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">אימייל *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register("email", { 
                    required: "שדה חובה",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "אנא הכנס כתובת אימייל תקינה"
                    }
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">טלפון *</Label>
                <Input
                  id="phone"
                  placeholder="טלפון נייד"
                  {...register("phone", { 
                    required: "שדה חובה",
                    pattern: {
                      value: /^0\d{8,9}$/,
                      message: "אנא הכנס מספר טלפון תקין"
                    }
                  })}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-4 justify-between">
            <Button form="registration-form" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  שולח...
                </>
              ) : (
                "שלח הרשמה"
              )}
            </Button>
            
            {bitPaymentLink && (
              <Button variant="outline" asChild className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                <a href={bitPaymentLink} target="_blank" rel="noopener noreferrer">
                  <DollarSign className="mr-2 h-4 w-4" />
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