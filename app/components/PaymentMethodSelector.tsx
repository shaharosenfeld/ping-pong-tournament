"use client"

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard as CreditCardIcon, Smartphone, Globe } from "lucide-react";
import CreditCardPayment from './CreditCardPayment';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface PaymentMethodSelectorProps {
  registrationId: string;
  tournamentId: string;
  amount: number;
  bitPaymentPhone?: string | null;
  bitPaymentName?: string | null;
  payboxPaymentLink?: string | null;
  onSuccess: () => void;
}

export default function PaymentMethodSelector({
  registrationId,
  tournamentId,
  amount,
  bitPaymentPhone,
  bitPaymentName,
  payboxPaymentLink,
  onSuccess
}: PaymentMethodSelectorProps) {
  const [activeTab, setActiveTab] = useState<string>("credit");
  const { toast } = useToast();

  // יצירת קישור ביט שיכלול את כל הפרטים הנדרשים
  const generateBitPaymentLink = () => {
    if (!bitPaymentPhone || !amount) return null;
    
    // וידוא שמספר הטלפון נקי מתווים מיוחדים
    const cleanPhone = bitPaymentPhone.replace(/[-\s]/g, '');
    
    // קישור רשמי לביט - פותח את האפליקציה ישירות
    return `https://bit.me/p/${cleanPhone}?am=${amount}&rm=${encodeURIComponent(bitPaymentName || `טורניר פינג פונג`)}`;
  };

  // קישור לתשלום בביט
  const bitPaymentLink = bitPaymentPhone ? generateBitPaymentLink() : null;

  // פונקציה לאישור תשלום
  const confirmExternalPayment = async (method: 'bit' | 'paybox') => {
    try {
      const response = await fetch('/api/payment-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId,
          paymentMethod: method,
          paymentStatus: 'confirmed',
          paymentReference: `${method}-${Date.now()}`,
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
      
      onSuccess();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה באישור התשלום",
        variant: "destructive",
      });
    }
  };

  // פותח קישור תשלום חיצוני ושואל את המשתמש אם התשלום הושלם
  const processExternalPayment = async (method: 'bit' | 'paybox') => {
    const url = method === 'bit' ? bitPaymentLink : payboxPaymentLink;
    
    if (!url) {
      toast({
        title: "שגיאה",
        description: `קישור לתשלום ב-${method === 'bit' ? 'ביט' : 'פייבוקס'} לא זמין`,
        variant: "destructive",
      });
      return;
    }
    
    // Store registration ID in localStorage for recovery
    localStorage.setItem('pendingRegistrationId', registrationId);
    
    // Open payment link in new window
    const paymentWindow = window.open(url, '_blank');
    
    if (!paymentWindow) {
      toast({
        title: "שגיאה בפתיחת קישור",
        description: "לא הצלחנו לפתוח את קישור התשלום. אנא אפשר חלונות קופצים או נסה שוב.",
        variant: "destructive",
      });
      return;
    }
    
    // Ask the user if payment was completed after a moment
    setTimeout(() => {
      const confirmed = confirm(
        `האם השלמת את התשלום ב-${method === 'bit' ? 'ביט' : 'פייבוקס'}?\n\n` +
        "⚠️ חשוב: אישור תשלום שלא בוצע בפועל הוא עבירה על תנאי השימוש.\n\n" +
        "לחץ 'אישור' רק אם התשלום הושלם, או 'ביטול' אם טרם ביצעת את התשלום."
      );
      
      if (confirmed) {
        confirmExternalPayment(method);
      } else {
        toast({
          title: "תשלום לא הושלם",
          description: "תוכל להשלים את התשלום מאוחר יותר",
          variant: "default",
        });
      }
    }, 8000);
  };

  // רשימת אמצעי התשלום הזמינים
  const availablePaymentMethods = [
    { id: "credit", name: "כרטיס אשראי", icon: <CreditCardIcon className="h-4 w-4" /> },
    ...(bitPaymentPhone ? [{ id: "bit", name: "תשלום בביט", icon: <Smartphone className="h-4 w-4" /> }] : []),
    ...(payboxPaymentLink ? [{ id: "paybox", name: "Paybox", icon: <Globe className="h-4 w-4" /> }] : [])
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">בחר אמצעי תשלום</h3>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availablePaymentMethods.length}, 1fr)` }}>
          {availablePaymentMethods.map(method => (
            <TabsTrigger 
              key={method.id} 
              value={method.id}
              className="flex items-center space-x-2"
            >
              {method.icon}
              <span>{method.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="credit" className="mt-4">
          <CreditCardPayment 
            registrationId={registrationId}
            tournamentId={tournamentId}
            amount={amount}
            onSuccess={onSuccess}
          />
        </TabsContent>
        
        <TabsContent value="bit" className="mt-4">
          <div className="bg-blue-50 p-6 rounded-lg space-y-4">
            <div className="flex items-center space-x-3">
              <img src="/bit-logo.png" alt="ביט" className="h-8 w-8" />
              <div>
                <h4 className="font-medium text-lg">תשלום באמצעות ביט</h4>
                <p className="text-sm text-gray-600">העברה מהירה וקלה לטלפון {bitPaymentPhone}</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-700">
              <p>שם לתשלום: {bitPaymentName || "טורניר פינג פונג"}</p>
              <p>סכום: {amount}₪</p>
            </div>
            
            <div className="bg-white p-4 rounded border border-gray-200">
              <p className="text-sm">לאחר לחיצה על הכפתור למטה, תועבר לאפליקציית ביט לביצוע התשלום.</p>
              <p className="text-sm mt-2">לאחר ביצוע התשלום, חזור לעמוד זה ואשר שהתשלום בוצע.</p>
            </div>
            
            <Button 
              onClick={() => processExternalPayment('bit')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              פתח את ביט לתשלום
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="paybox" className="mt-4">
          <div className="bg-green-50 p-6 rounded-lg space-y-4">
            <div className="flex items-center space-x-3">
              <Globe className="h-7 w-7 text-green-600" />
              <div>
                <h4 className="font-medium text-lg">תשלום באמצעות Paybox</h4>
                <p className="text-sm text-gray-600">תשלום מאובטח באמצעות שירות Paybox</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-700">
              <p>סכום: {amount}₪</p>
            </div>
            
            <div className="bg-white p-4 rounded border border-gray-200">
              <p className="text-sm">לאחר לחיצה על הכפתור למטה, תועבר לדף התשלום של Paybox לביצוע התשלום.</p>
              <p className="text-sm mt-2">לאחר ביצוע התשלום, חזור לעמוד זה ואשר שהתשלום בוצע.</p>
            </div>
            
            <Button 
              onClick={() => processExternalPayment('paybox')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              המשך לתשלום ב-Paybox
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 