"use client"

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard as CreditCardIcon, Smartphone, Globe, Copy, Check, ExternalLink } from "lucide-react";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [bitPaymentCompleted, setBitPaymentCompleted] = useState(false);
  const [payboxPaymentCompleted, setPayboxPaymentCompleted] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
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

  // פונקציית העתקה ללוח
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedToClipboard(true);
      toast({
        title: "הועתק ללוח",
        description: "המידע הועתק בהצלחה",
        variant: "default",
      });
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({
        title: "שגיאה בהעתקה",
        description: "לא ניתן להעתיק את המידע",
        variant: "destructive",
      });
    });
  };

  // פונקציה לאישור תשלום
  const confirmPayment = async (method: 'bit' | 'paybox') => {
    try {
      setIsProcessing(true);
      
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
      
      // עדכון סטטוס תשלום לפי סוג התשלום
      if (method === 'bit') setBitPaymentCompleted(true);
      if (method === 'paybox') setPayboxPaymentCompleted(true);
      
      onSuccess();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה באישור התשלום",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
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
              className="flex items-center gap-2 rtl:space-x-reverse"
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
          {bitPaymentCompleted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">התשלום בביט אושר בהצלחה!</h3>
              <p className="text-green-700">
                ההרשמה לטורניר הושלמה. אישור ישלח לדוא"ל שלך בהקדם.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 p-6 rounded-lg space-y-4">
              <div className="flex items-center gap-3 rtl:space-x-reverse">
                <img src="/bit-logo.svg" alt="ביט" className="h-8 w-8" />
                <div>
                  <h4 className="font-medium text-lg">תשלום באמצעות ביט</h4>
                  <p className="text-sm text-gray-600">העברה מהירה וקלה</p>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg border border-gray-200 space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">מספר טלפון לתשלום:</div>
                  <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md">
                    <div className="font-medium text-lg">{bitPaymentPhone}</div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => copyToClipboard(bitPaymentPhone || '')}
                      className="h-8 w-8"
                    >
                      {copiedToClipboard ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">שם לתשלום:</div>
                  <div className="font-medium">{bitPaymentName || "טורניר פינג פונג"}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">סכום לתשלום:</div>
                  <div className="font-bold text-blue-600 text-xl">{amount}₪</div>
                </div>
                
                <div className="flex flex-col gap-3 pt-2">
                  {bitPaymentLink && (
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center gap-2 rtl:space-x-reverse"
                      onClick={() => window.open(bitPaymentLink, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>פתח את אפליקציית ביט</span>
                    </Button>
                  )}
                  
                  <div className="text-sm text-gray-500 text-center">- או -</div>
                  
                  <div className="text-sm">
                    1. פתח את אפליקציית ביט
                    <br />
                    2. בצע העברה למספר הטלפון ולסכום המוצגים
                    <br />
                    3. לאחר ביצוע ההעברה, לחץ על כפתור "אישור תשלום"
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => confirmPayment('bit')}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    מאשר תשלום...
                  </>
                ) : (
                  "אישור תשלום"
                )}
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="paybox" className="mt-4">
          {payboxPaymentCompleted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">התשלום ב-Paybox אושר בהצלחה!</h3>
              <p className="text-green-700">
                ההרשמה לטורניר הושלמה. אישור ישלח לדוא"ל שלך בהקדם.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 p-6 rounded-lg space-y-4">
              <div className="flex items-center gap-3 rtl:space-x-reverse">
                <Globe className="h-7 w-7 text-green-600" />
                <div>
                  <h4 className="font-medium text-lg">תשלום באמצעות Paybox</h4>
                  <p className="text-sm text-gray-600">תשלום מאובטח באמצעות שירות Paybox</p>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg border border-gray-200 space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">סכום לתשלום:</div>
                  <div className="font-bold text-green-600 text-xl">{amount}₪</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm">
                    1. לחץ על הכפתור למטה כדי לפתוח את דף התשלום של Paybox
                    <br />
                    2. השלם את התשלום בהתאם להוראות באתר Paybox
                    <br />
                    3. לאחר השלמת התשלום, חזור לכאן ולחץ על "אישור תשלום"
                  </div>
                </div>
                
                {payboxPaymentLink && (
                  <Button 
                    variant="outline"
                    className="w-full flex items-center gap-2 rtl:space-x-reverse"
                    onClick={() => window.open(payboxPaymentLink, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>פתח את דף התשלום של Paybox</span>
                  </Button>
                )}
              </div>
              
              <Button 
                onClick={() => confirmPayment('paybox')}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    מאשר תשלום...
                  </>
                ) : (
                  "אישור תשלום"
                )}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 