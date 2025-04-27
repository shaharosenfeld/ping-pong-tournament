"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { UploadCloud, Loader2 } from "lucide-react";

interface PaymentEvidenceUploaderProps {
  registrationId: string;
  onSuccess?: (fileUrl: string) => void;
}

export default function PaymentEvidenceUploader({ 
  registrationId, 
  onSuccess 
}: PaymentEvidenceUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: "סוג קובץ לא נתמך",
          description: "אנא העלה תמונה בלבד (JPG, PNG, GIF)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (2MB limit)
      if (selectedFile.size > 2 * 1024 * 1024) {
        toast({
          title: "קובץ גדול מדי",
          description: "גודל הקובץ חייב להיות קטן מ-2MB",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "לא נבחר קובץ",
        description: "אנא בחר קובץ להעלאה",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('registrationId', registrationId);
      formData.append('notes', notes);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'שגיאה בהעלאת הקובץ');
      }
      
      const data = await response.json();
      
      toast({
        title: "הקובץ הועלה בהצלחה",
        description: "הוכחת התשלום התקבלה ותיבדק בהקדם",
        variant: "default",
      });
      
      // Reset form
      setFile(null);
      setNotes("");
      setPreviewUrl(null);
      
      // Call success callback if provided
      if (onSuccess && data.fileUrl) {
        onSuccess(data.fileUrl);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "שגיאה בהעלאת הקובץ",
        description: error instanceof Error ? error.message : 'אירעה שגיאה בלתי צפויה',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4" dir="rtl">
      <h3 className="font-medium text-lg">העלאת אסמכתא לתשלום</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="payment-evidence" className="text-sm font-medium">
            צילום מסך / אסמכתא לתשלום
          </label>
          
          <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
            <input
              id="payment-evidence"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            
            {previewUrl ? (
              <div className="relative w-full">
                <img 
                  src={previewUrl} 
                  alt="תצוגה מקדימה" 
                  className="mx-auto max-h-48 object-contain rounded-md" 
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                  title="הסר תמונה"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label htmlFor="payment-evidence" className="flex flex-col items-center space-y-2 cursor-pointer">
                <UploadCloud className="h-10 w-10 text-gray-400" />
                <span className="text-sm text-gray-500">לחץ כאן להעלאת תמונה</span>
                <span className="text-xs text-gray-400">
                  PNG, JPG, GIF עד 2MB
                </span>
              </label>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="payment-notes" className="text-sm font-medium">
            הערות (אופציונלי)
          </label>
          <Textarea
            id="payment-notes"
            placeholder="פרטים נוספים על התשלום, למשל: שולם דרך אפליקציית ביט"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isUploading}
            rows={3}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={!file || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              מעלה...
            </>
          ) : (
            "העלה אסמכתא"
          )}
        </Button>
      </form>
    </div>
  );
} 