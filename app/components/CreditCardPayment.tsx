"use client"

import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle, Lock, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreditCardPaymentProps {
  registrationId: string;
  amount: number;
  tournamentId: string;
  onSuccess: () => void;
}

export default function CreditCardPayment({ 
  registrationId, 
  amount, 
  tournamentId,
  onSuccess 
}: CreditCardPaymentProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Format card number with spaces every 4 digits
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format expiry date as MM/YY
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
      return v.slice(0, 2) + (v.length > 2 ? '/' + v.slice(2, 4) : '');
    }
    
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCardNumber(formatCardNumber(value));
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setExpiryDate(formatExpiryDate(value));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCvv(value);
  };

  const validateForm = () => {
    // Basic validation
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      toast({
        title: "מספר כרטיס לא תקין",
        description: "אנא הזן מספר כרטיס אשראי תקין (16 ספרות)",
        variant: "destructive",
      });
      return false;
    }

    if (!cardHolder) {
      toast({
        title: "שם בעל הכרטיס חסר",
        description: "אנא הזן את שם בעל הכרטיס",
        variant: "destructive",
      });
      return false;
    }

    if (!expiryDate || !expiryDate.includes('/') || expiryDate.length !== 5) {
      toast({
        title: "תאריך תפוגה לא תקין",
        description: "אנא הזן תאריך תפוגה בפורמט MM/YY",
        variant: "destructive",
      });
      return false;
    }

    if (!cvv || cvv.length !== 3) {
      toast({
        title: "קוד אבטחה לא תקין",
        description: "אנא הזן קוד אבטחה (3 ספרות בגב הכרטיס)",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const processPayment = async () => {
    if (!validateForm()) return;

    try {
      setIsProcessing(true);

      // Simulate payment processing with a short delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real implementation, you would call your payment processor API here
      // The code below is a placeholder for the actual implementation

      // After successful payment, update the payment status
      const response = await fetch('/api/payment-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId,
          paymentMethod: 'credit',
          paymentStatus: 'confirmed',
          paymentReference: `credit-${Date.now()}`,
          notes: `תשלום בכרטיס אשראי - ${cardNumber.slice(-4)}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בעיבוד התשלום');
      }

      setIsPaymentComplete(true);
      toast({
        title: "התשלום בוצע בהצלחה!",
        description: "ההרשמה הושלמה. פרטים ישלחו לדוא\"ל שלך.",
        variant: "default",
      });

      onSuccess();

      // Redirect to tournament page after a short delay
      setTimeout(() => {
        router.push(`/tournaments/${tournamentId}`);
      }, 3000);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "שגיאה בעיבוד התשלום",
        description: error instanceof Error ? error.message : 'אירעה שגיאה בעיבוד התשלום',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isPaymentComplete) {
    return (
      <div className="flex flex-col items-center space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-green-800">התשלום בוצע בהצלחה!</h3>
        <p className="text-green-700 text-center">
          ההרשמה לטורניר הושלמה. אישור ישלח לדוא"ל שלך בהקדם.
        </p>
        <Button 
          onClick={() => router.push(`/tournaments/${tournamentId}`)}
          className="mt-4"
        >
          לדף הטורניר
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <div className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
          <h3 className="font-semibold text-lg">תשלום בכרטיס אשראי</h3>
        </div>
        <div className="text-sm text-blue-600 font-medium">
          {amount}₪
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="card-number">מספר כרטיס</Label>
          <div className="relative">
            <Input
              id="card-number"
              type="text"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={handleCardNumberChange}
              maxLength={19}
              className="pl-10"
              dir="ltr"
            />
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="card-holder">שם בעל הכרטיס</Label>
          <Input
            id="card-holder"
            type="text"
            placeholder="ישראל ישראלי"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            dir="rtl"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiry-date">תוקף</Label>
            <Input
              id="expiry-date"
              type="text"
              placeholder="MM/YY"
              value={expiryDate}
              onChange={handleExpiryDateChange}
              maxLength={5}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cvv">קוד אבטחה (CVV)</Label>
            <div className="relative">
              <Input
                id="cvv"
                type="text"
                placeholder="123"
                value={cvv}
                onChange={handleCvvChange}
                maxLength={3}
                className="pl-10"
                dir="ltr"
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mt-2">
        <div className="text-xs text-gray-500 mb-4 flex items-center">
          <Lock className="h-3 w-3 mr-1" />
          העסקה מאובטחת ומוצפנת בתקן SSL. פרטי הכרטיס אינם נשמרים במערכת.
        </div>
        <Button
          onClick={processPayment}
          disabled={isProcessing}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? (
            <>
              <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
              מעבד תשלום...
            </>
          ) : (
            `שלם ${amount}₪`
          )}
        </Button>
      </div>
    </div>
  );
} 