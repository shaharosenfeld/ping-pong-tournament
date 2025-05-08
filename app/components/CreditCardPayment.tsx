"use client"

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Check, CreditCard as CreditCardIcon, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

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
  const [cardType, setCardType] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();
  
  const { register, handleSubmit, watch, formState: { errors, isValid, isDirty }, setValue, trigger } = useForm<CardFormData>({
    mode: 'onChange'
  });
  
  const cardNumber = watch('cardNumber', '');
  const expiryDate = watch('expiryDate', '');

  // Detect card type based on card number
  useEffect(() => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (cleanNumber.startsWith('4')) {
      setCardType('visa');
    } else if (/^5[1-5]/.test(cleanNumber)) {
      setCardType('mastercard');
    } else if (/^3[47]/.test(cleanNumber)) {
      setCardType('amex');
    } else if (/^(62|88)/.test(cleanNumber)) {
      setCardType('unionpay');
    } else if (cleanNumber.startsWith('6')) {
      setCardType('discover');
    } else {
      setCardType('');
    }
  }, [cardNumber]);

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
      <motion.div 
        className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">התשלום התקבל בהצלחה!</h3>
        <p className="text-green-700">
          ההרשמה לטורניר הושלמה. אישור ישלח לדוא"ל שלך בהקדם.
        </p>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4 rtl:space-x-reverse">
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <CreditCardIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium">תשלום בכרטיס אשראי</h4>
            <p className="text-sm text-gray-600">תשלום מאובטח. כל הפרטים מוצפנים.</p>
          </div>
        </div>
        
        <div className="text-xl font-bold text-blue-600 mb-6 payment-amount">
          {amount}₪
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="mobile-form-group">
            <Label htmlFor="cardholderName" className="mobile-form-label">שם בעל הכרטיס</Label>
            <Input
              id="cardholderName"
              placeholder="ישראל ישראלי"
              {...register('cardholderName', { 
                required: "יש להזין שם מלא", 
                validate: validateName 
              })}
              className={`${errors.cardholderName ? "border-red-500 focus:border-red-500" : "focus:border-blue-500"} h-12 px-4 text-base transition duration-200`}
              dir="rtl"
            />
            {errors.cardholderName && (
              <motion.p 
                className="text-red-500 text-sm mt-1 flex items-center gap-1"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {errors.cardholderName.message}
              </motion.p>
            )}
          </div>
          
          <div className="mobile-form-group">
            <Label htmlFor="cardNumber" className="mobile-form-label">מספר כרטיס</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="XXXX XXXX XXXX XXXX"
                {...register('cardNumber', { 
                  required: "יש להזין מספר כרטיס", 
                  validate: validateCardNumber 
                })}
                className={`${errors.cardNumber ? "border-red-500 focus:border-red-500" : "focus:border-blue-500"} h-12 px-4 text-base pr-10 transition duration-200`}
                dir="ltr"
                inputMode="numeric"
                pattern="[0-9\s]*"
                autoComplete="cc-number"
              />
              {cardType && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <img 
                    src={`/card-icons/${cardType}.svg`} 
                    alt={cardType} 
                    className="h-6 w-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            {errors.cardNumber && (
              <motion.p 
                className="text-red-500 text-sm mt-1 flex items-center gap-1"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {errors.cardNumber.message}
              </motion.p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="mobile-form-group">
              <Label htmlFor="expiryDate" className="mobile-form-label">תוקף</Label>
              <Input
                id="expiryDate"
                placeholder="MM/YY"
                {...register('expiryDate', { 
                  required: "יש להזין תאריך תוקף", 
                  validate: validateExpiry 
                })}
                className={`${errors.expiryDate ? "border-red-500 focus:border-red-500" : "focus:border-blue-500"} h-12 px-4 text-base transition duration-200`}
                dir="ltr"
                maxLength={5}
                inputMode="numeric"
                pattern="[0-9/]*"
                autoComplete="cc-exp"
              />
              {errors.expiryDate && (
                <motion.p 
                  className="text-red-500 text-sm mt-1 flex items-center gap-1"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {errors.expiryDate.message}
                </motion.p>
              )}
            </div>
            
            <div className="mobile-form-group">
              <Label htmlFor="cvv" className="mobile-form-label">CVV</Label>
              <div className="relative">
                <Input
                  id="cvv"
                  type="tel"
                  placeholder="XXX"
                  maxLength={4}
                  {...register('cvv', { 
                    required: "יש להזין קוד אבטחה", 
                    validate: validateCVV 
                  })}
                  className={`${errors.cvv ? "border-red-500 focus:border-red-500" : "focus:border-blue-500"} h-12 px-4 text-base pr-10 transition duration-200`}
                  dir="ltr"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="cc-csc"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              {errors.cvv && (
                <motion.p 
                  className="text-red-500 text-sm mt-1 flex items-center gap-1"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {errors.cvv.message}
                </motion.p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col mt-6">
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: isProcessing ? 0.7 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <Button 
                type="submit" 
                disabled={isProcessing}
                className="w-full h-12 text-base touch-target press-effect"
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
            </motion.div>
            
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-3">
              <Lock className="h-3 w-3" />
              <span>המידע מאובטח ומוצפן. לא נשמור את פרטי כרטיס האשראי שלך.</span>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
} 