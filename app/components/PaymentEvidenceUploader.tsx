"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Check, Image, Upload, LoaderCircle, Camera } from 'lucide-react';

interface PaymentEvidenceUploaderProps {
  registrationId: string;
  onSuccess: () => void;
}

export default function PaymentEvidenceUploader({ registrationId, onSuccess }: PaymentEvidenceUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: "סוג קובץ לא נתמך",
        description: "אנא העלה קובץ בפורמט תמונה (JPG, PNG) או PDF",
        variant: "destructive",
      });
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    
    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: "קובץ גדול מדי",
        description: "גודל הקובץ המקסימלי הוא 5MB",
        variant: "destructive",
      });
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    
    setFile(selectedFile);
    
    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      // For PDFs, show a generic icon/thumbnail
      setPreviewUrl(null);
    }
  };
  
  const handleCapture = () => {
    // Try to access the device camera using the file input
    const fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file');
    fileInput.setAttribute('accept', 'image/*');
    fileInput.setAttribute('capture', 'environment'); // Use the back camera by default
    
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const selectedFile = target.files[0];
        
        // Check file size (max 5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
          toast({
            title: "קובץ גדול מדי",
            description: "גודל הקובץ המקסימלי הוא 5MB",
            variant: "destructive",
          });
          return;
        }
        
        setFile(selectedFile);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviewUrl(event.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      }
    };
    
    fileInput.click();
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('registrationId', registrationId);
      
      const response = await fetch('/api/upload-payment-evidence', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      setIsComplete(true);
      
      toast({
        title: "הקובץ הועלה בהצלחה",
        description: "אישור התשלום יועבר לבדיקה",
        variant: "default",
      });
      
      // Notify parent component of success
      onSuccess();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "שגיאה בהעלאת הקובץ",
        description: "אירעה שגיאה בהעלאת הקובץ. אנא נסה שנית.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  if (isComplete) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4 sm:p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">הקובץ הועלה בהצלחה!</h3>
        <p className="text-green-700">
          אישור התשלום התקבל ויועבר לבדיקה בהקדם.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border border-dashed border-gray-300 rounded-md p-4 sm:p-6 bg-gray-50">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <Upload className="h-10 w-10 text-gray-400" />
          <p className="text-base font-medium">העלה צילום מסך או תמונה של אישור התשלום</p>
          <p className="text-xs text-gray-500">תמונות (JPG, PNG) או PDF עד 5MB</p>
          
          {previewUrl && previewUrl.startsWith('data:image') && (
            <div className="mt-2 relative w-full max-w-xs">
              <img 
                src={previewUrl} 
                alt="תצוגה מקדימה" 
                className="w-full h-auto rounded-md object-contain max-h-64 border border-gray-200" 
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                <Check className="h-4 w-4" />
              </div>
            </div>
          )}
          
          {file && !previewUrl && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md border border-blue-100 w-full max-w-xs">
              <Image className="h-6 w-6 text-blue-500" />
              <div className="flex-1 text-sm overflow-hidden">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <Check className="h-5 w-5 text-green-500" />
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCapture}
              className="w-full py-3 flex items-center justify-center gap-2 touch-target"
            >
              <Camera className="h-5 w-5" />
              <span>צלם עכשיו</span>
            </Button>
            
            <div className="relative w-full">
              <Input
                id="payment-evidence"
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileChange}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
              />
              <Button
                type="button"
                variant="secondary"
                className="w-full py-3 flex items-center justify-center gap-2 touch-target"
              >
                <Upload className="h-5 w-5" />
                <span>בחר קובץ</span>
              </Button>
            </div>
          </div>
          
          {file && (
            <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <Check className="h-3 w-3" />
              הקובץ מוכן להעלאה
            </div>
          )}
        </div>
      </div>
      
      <Button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full py-3 text-base touch-target"
      >
        {isUploading ? (
          <>
            <LoaderCircle className="h-5 w-5 mr-2 animate-spin" />
            מעלה...
          </>
        ) : (
          "העלה הוכחת תשלום"
        )}
      </Button>
    </div>
  );
} 