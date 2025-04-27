"use client"

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Check, CreditCard as CreditCardIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreditCardPaymentProps {
  registrationId: string;
  tournamentId: string;
  amount: number;
  onSuccess: () => void;
}

interface CardFormData {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
}

export default function CreditCardPayment({
  registrationId,
  tournamentId,
  amount,
  onSuccess
}: CreditCardPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [cardNumberPreview, setCardNumberPreview] = useState('');
  const [formattedExpiry, setFormattedExpiry] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm<CardFormData>();
  
  const cardNumber = watch('cardNumber', '');
  const expiryDate = watch('expiryDate', '');

  // Format card number with spaces for readability (XXXX XXXX XXXX XXXX)
  useEffect(() => {
    const formatted = cardNumber
      .replace(/\s/g, '')
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, '$1 ');
    
    if (formatted !== cardNumber) {
      setValue('cardNumber', formatted);
    }
    
    // Create masked preview for display
    if (formatted) {
      const lastFourVisible = formatted.slice(-5); // Include the last space + 4 digits
      const maskedPart = formatted.slice(0, -5).replace(/\d/g, '•');
      setCardNumberPreview(maskedPart + lastFourVisible);
    } else {
      setCardNumberPreview('');
    }
  }, [cardNumber, setValue]);
  
  // Format expiry date as MM/YY
  useEffect(() => {
    const expiry = expiryDate.replace(/\D/g, '').slice(0, 4);
    
    if (expiry.length >= 2) {
      const formatted = `${expiry.slice(0, 2)}/${expiry.slice(2)}`;
      if (formatted !== expiryDate) {
        setValue('expiryDate', formatted);
      }
      setFormattedExpiry(formatted);
    } else {
      if (expiry !== expiryDate) {
        setValue('expiryDate', expiry);
      }
      setFormattedExpiry(expiry);
    }
  }, [expiryDate, setValue]);
  
  const validateCardNumber = (value: string) => {
    // Basic validation: must be 16 digits (excluding spaces)
    return value.replace(/\s/g, '').length === 16 || "מספר כרטיס לא תקין";
  };
  
  const validateExpiry = (value: string) => {
    // Must match MM/YY format
    if (!/^\d{2}\/\d{2}$/.test(value)) {
      return "פורמט לא תקין (MM/YY)";
    }
    
    const [month, year] = value.split('/').map(v => parseInt(v, 10));
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
    const currentMonth = currentDate.getMonth() + 1; // JS months are 0-based
    
    if (month < 1 || month > 12) {
      return "חודש לא תקין";
    }
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return "הכרטיס פג תוקף";
    }
    
    return true;
  };
  
  const validateCVV = (value: string) => {
    // Must be 3 or 4 digits
    return /^\d{3,4}$/.test(value) || "קוד אבטחה לא תקין";
  };
  
  const validateName = (value: string) => {
    return value.trim().length >= 2 || "יש להזין שם מלא";
  };
  
  const processPayment = async (data: CardFormData) => {
    try {
      setIsProcessing(true);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For simulation purposes, let's assume payment is successful
      // In a real app, you would integrate with a payment processor here
      const paymentStatus = 'confirmed';
      const paymentReference = `CC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      const response = await fetch('/api/payment-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId,
          paymentMethod: 'credit',
          paymentStatus,
          paymentReference,
          notes: `תשלום כרטיס אשראי - ${data.cardholderName} - ${cardNumberPreview}`
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process payment');
      }
      
      setIsComplete(true);
      
      toast({
        title: "התשלום התקבל בהצלחה",
        description: "פרטי ההרשמה לטורניר יישלחו לדוא״ל שלך",
        variant: "default",
      });
      
      // Wait 2 seconds before redirecting
      setTimeout(() => {
        onSuccess();
        router.push(`/tournaments/${tournamentId}`);
      }, 2000);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "שגיאה בעיבוד התשלום",
        description: "אירעה שגיאה בתהליך התשלום. אנא נסה שנית.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const onSubmit = (data: CardFormData) => {
    // Validate card number (Luhn algorithm can be added for production)
    if (!validateCardNumber(data.cardNumber)) {
      toast({
        title: "שגיאה בפרטי כרטיס",
        description: "מספר כרטיס האשראי אינו תקין",
        variant: "destructive",
      });
      return;
    }
    
    // Validate expiry date
    const expiryValidation = validateExpiry(data.expiryDate);
    if (expiryValidation !== true) {
      toast({
        title: "שגיאה בפרטי כרטיס",
        description: expiryValidation as string,
        variant: "destructive",
      });
      return;
    }
    
    // Validate CVV
    if (!validateCVV(data.cvv)) {
      toast({
        title: "שגיאה בפרטי כרטיס",
        description: "קוד האבטחה (CVV) אינו תקין",
        variant: "destructive",
      });
      return;
    }
    
    // Validate cardholder name
    if (!validateName(data.cardholderName)) {
      toast({
        title: "שגיאה בפרטי כרטיס",
        description: "יש להזין שם מלא על הכרטיס",
        variant: "destructive",
      });
      return;
    }
    
    // All validations passed, process payment
    processPayment(data);
  };
  
  if (isComplete) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">התשלום התקבל בהצלחה!</h3>
        <p className="text-green-700">
          ההרשמה לטורניר הושלמה. אישור ישלח לדוא"ל שלך בהקדם.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-4 rtl:space-x-reverse">
          <CreditCardIcon className="h-6 w-6 text-blue-600" />
          <div>
            <h4 className="font-medium">תשלום בכרטיס אשראי</h4>
            <p className="text-sm text-gray-600">תשלום מאובטח. כל הפרטים מוצפנים.</p>
          </div>
        </div>
        
        <div className="text-xl font-bold text-blue-600 mb-6">
          {amount}₪
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardholderName">שם בעל הכרטיס</Label>
            <Input
              id="cardholderName"
              placeholder="ישראל ישראלי"
              {...register('cardholderName', { required: true })}
              className={`${errors.cardholderName ? "border-red-500" : ""} h-12 px-4 text-base`}
              dir="rtl"
            />
            {errors.cardholderName && <p className="text-red-500 text-sm">יש להזין שם מלא</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cardNumber">מספר כרטיס</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="XXXX XXXX XXXX XXXX"
                {...register('cardNumber', { required: true })}
                className={`${errors.cardNumber ? "border-red-500" : ""} h-12 px-4 text-base`}
                dir="ltr"
                inputMode="numeric"
                pattern="[0-9\s]*"
              />
            </div>
            {errors.cardNumber && <p className="text-red-500 text-sm">יש להזין מספר כרטיס תקין</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">תוקף</Label>
              <Input
                id="expiryDate"
                placeholder="MM/YY"
                {...register('expiryDate', { required: true })}
                className={`${errors.expiryDate ? "border-red-500" : ""} h-12 px-4 text-base`}
                dir="ltr"
                maxLength={5}
                inputMode="numeric"
                pattern="[0-9/]*"
              />
              {errors.expiryDate && <p className="text-red-500 text-sm">יש להזין תאריך תקף</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="tel"
                placeholder="XXX"
                maxLength={4}
                {...register('cvv', { required: true })}
                className={`${errors.cvv ? "border-red-500" : ""} h-12 px-4 text-base`}
                dir="ltr"
                inputMode="numeric"
                pattern="[0-9]*"
              />
              {errors.cvv && <p className="text-red-500 text-sm">יש להזין קוד אבטחה</p>}
            </div>
          </div>
          
          <div className="flex flex-col mt-6">
            <Button 
              type="submit" 
              disabled={isProcessing}
              className="w-full h-12 text-base touch-target"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>מעבד תשלום...</span>
                </div>
              ) : (
                <span>שלם {amount}₪</span>
              )}
            </Button>
            
            <div className="text-xs text-gray-500 mt-2 text-center">
              המידע מאובטח ומוצפן. לא נשמור את פרטי כרטיס האשראי שלך.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 