"use client"

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Upload, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface PaymentEvidenceUploaderProps {
  registrationId: string;
  onSuccess: () => void;
}

export default function PaymentEvidenceUploader({ registrationId, onSuccess }: PaymentEvidenceUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "שגיאה",
        description: "יש לבחור קובץ להעלאה",
        variant: "destructive",
      });
      return;
    }

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "סוג קובץ לא תקין",
        description: "ניתן להעלות רק תמונות (JPG, PNG) ומסמכי PDF",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "קובץ גדול מדי",
        description: "גודל הקובץ המקסימלי הוא 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);
      formData.append('registrationId', registrationId);

      // Upload the file
      const response = await fetch('/api/upload/payment-evidence', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בהעלאת הקובץ');
      }

      const data = await response.json();

      // Update the registration with payment evidence
      const confirmResponse = await fetch('/api/payment-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId,
          paymentMethod: 'other',
          paymentStatus: 'pending', // Will require admin approval
          paymentReference: `evidence-${Date.now()}`,
          evidenceUrl: data.url,
          notes: 'העלאת הוכחת תשלום ידנית'
        }),
      });

      if (!confirmResponse.ok) {
        const confirmErrorData = await confirmResponse.json();
        throw new Error(confirmErrorData.error || 'שגיאה בעדכון פרטי התשלום');
      }

      toast({
        title: "הקובץ הועלה בהצלחה",
        description: "הוכחת התשלום התקבלה ותיבדק על ידי המנהל בהקדם",
        variant: "default",
      });

      // Call the success callback
      onSuccess();
    } catch (error) {
      console.error('Error uploading payment evidence:', error);
      toast({
        title: "שגיאה בהעלאה",
        description: error instanceof Error ? error.message : 'אירעה שגיאה בהעלאת הקובץ',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-sm font-medium">העלה צילום מסך או תמונה של אישור התשלום</p>
          <p className="text-xs text-gray-500">תמונות (JPG, PNG) או PDF עד 5MB</p>
          
          <Input
            id="payment-evidence"
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleFileChange}
            className="max-w-xs mt-2"
          />
          
          {file && (
            <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <Check className="h-3 w-3" />
              {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </div>
          )}
        </div>
      </div>
      
      <Button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
            מעלה...
          </>
        ) : (
          "העלה הוכחת תשלום"
        )}
      </Button>
    </div>
  );
} 