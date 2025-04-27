"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, XCircle, AlertCircle, LoaderCircle, EyeIcon } from "lucide-react";
import Link from "next/link";
import { useAdminCheck } from "@/app/hooks/use-admin-check";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Transaction {
  id: string;
  registrationId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  paymentReference?: string;
  evidenceUrl?: string;
  createdAt: string;
  registration: {
    id: string;
    name: string;
    email: string;
    phone: string;
    tournament: {
      id: string;
      name: string;
    }
  }
}

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin, isLoading: isAdminLoading, redirectToLogin } = useAdminCheck();

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      redirectToLogin();
      return;
    }

    if (isAdmin) {
      fetchTransactions();
    }
  }, [isAdmin, isAdminLoading, redirectToLogin]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/transactions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת רשימת התשלומים",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaymentStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/transactions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update transaction status');
      }
      
      // Update local state
      setTransactions(transactions.map(t => 
        t.id === id ? { ...t, status } : t
      ));
      
      toast({
        title: "סטטוס עודכן",
        description: "סטטוס התשלום עודכן בהצלחה",
        variant: "default",
      });
      
      // Refresh data
      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction status:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון סטטוס התשלום",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">אושר</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">ממתין לאישור</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">נכשל</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-100 text-blue-800">הוחזר</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isAdminLoading) {
    return (
      <div className="container py-8" dir="rtl">
        <div className="text-center">
          <LoaderCircle className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">טוען...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container py-8" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ניהול תשלומים</h1>
        <Link href="/admin">
          <Button variant="outline">חזרה לדף הניהול</Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <LoaderCircle className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">טוען רשימת תשלומים...</p>
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
            <p>לא נמצאו תשלומים במערכת</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {transaction.registration.name} - {transaction.registration.tournament.name}
                    </CardTitle>
                    <CardDescription>
                      {getStatusBadge(transaction.status)}
                      <span className="mx-2">•</span>
                      {transaction.paymentMethod}
                      {transaction.paymentReference && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-xs">אסמכתא: {transaction.paymentReference}</span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{transaction.amount} ₪</div>
                    <div className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">פרטי משתתף:</h4>
                    <p className="text-sm">
                      {transaction.registration.name}<br />
                      {transaction.registration.email}<br />
                      {transaction.registration.phone}
                    </p>
                  </div>
                  {transaction.evidenceUrl && (
                    <div className="flex items-center">
                      <Dialog>
                        <DialogTrigger>
                          <Button variant="outline" size="sm" className="flex items-center">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            הצג אסמכתא
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>אסמכתת תשלום</DialogTitle>
                            <DialogDescription>
                              {transaction.registration.name} - {formatDate(transaction.createdAt)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4 max-h-[80vh] overflow-auto">
                            <img 
                              src={transaction.evidenceUrl} 
                              alt="אסמכתת תשלום" 
                              className="mx-auto max-w-full object-contain rounded"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="bg-gray-50 border-t flex justify-end">
                {transaction.status === 'pending' && (
                  <div className="space-x-2 rtl:space-x-reverse">
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updatePaymentStatus(transaction.id, 'completed')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> אשר תשלום
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => updatePaymentStatus(transaction.id, 'failed')}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> דחה תשלום
                    </Button>
                  </div>
                )}
                
                {transaction.status === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => updatePaymentStatus(transaction.id, 'refunded')}
                  >
                    סמן כהוחזר
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 