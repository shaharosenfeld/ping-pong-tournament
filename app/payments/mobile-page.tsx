'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Wallet, ReceiptText, ArrowLeft, ChevronRight } from 'lucide-react';
import MobilePageLayout from '../components/MobilePageLayout';
import MobileNavigation from '../components/MobileNavigation';
import { ToastContainer, ToastRef } from '../components/ToastNotification';

export default function MobilePaymentPage() {
  const [activeMethod, setActiveMethod] = useState<string | null>(null);
  const toastRef = useRef<ToastRef>(null);
  
  // Payment methods with their respective details
  const paymentMethods = [
    {
      id: 'credit-card',
      name: 'Credit Card',
      icon: CreditCard,
      description: 'Pay securely using your credit card'
    },
    {
      id: 'bit',
      name: 'Bit Payment',
      icon: Wallet,
      description: 'Quick payment via Bit app',
      phoneNumber: '050-123-4567'
    },
    {
      id: 'paybox',
      name: 'Paybox',
      icon: Wallet,
      description: 'Send payment via Paybox',
      phoneNumber: '052-987-6543'
    },
    {
      id: 'manual',
      name: 'Manual Payment',
      icon: ReceiptText,
      description: 'Pay and upload payment evidence'
    }
  ];
  
  // Payment history (mock data)
  const paymentHistory = [
    {
      id: 'payment-1',
      date: '2023-06-15',
      amount: 250,
      tournament: 'Summer Championship 2023',
      status: 'completed',
      method: 'Credit Card'
    },
    {
      id: 'payment-2',
      date: '2023-05-02',
      amount: 150,
      tournament: 'Weekly Club Tournament',
      status: 'completed',
      method: 'Bit'
    },
    {
      id: 'payment-3',
      date: '2023-04-20',
      amount: 200,
      tournament: 'Spring Open 2023',
      status: 'refunded',
      method: 'Paybox'
    }
  ];
  
  // Handle payment method selection
  const handleMethodSelect = (methodId: string) => {
    setActiveMethod(methodId);
    toastRef.current?.showToast(`${methodId} payment method selected`, 'info');
  };
  
  // Copy phone number to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toastRef.current?.showToast('Phone number copied to clipboard!', 'success');
      })
      .catch(() => {
        toastRef.current?.showToast('Failed to copy text', 'error');
      });
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen pb-safe">
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* Page Layout */}
      <MobilePageLayout 
        title="Payments"
        subtitle="Manage your payments"
      >
        {/* Payment Methods */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
          
          <motion.div 
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {paymentMethods.map((method) => (
              <motion.div
                key={method.id}
                variants={itemVariants}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <button
                  className="w-full text-left p-4 touch-target"
                  onClick={() => handleMethodSelect(method.id)}
                >
                  <div className="flex items-center">
                    <div className="bg-primary/10 rounded-full p-2 mr-3">
                      <method.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{method.name}</h3>
                      <p className="text-sm text-gray-500">{method.description}</p>
                      
                      {/* Show phone number for mobile payment methods */}
                      {'phoneNumber' in method && (
                        <div className="mt-2 flex items-center">
                          <p className="text-sm bg-gray-100 px-2 py-1 rounded-md inline-flex">
                            {method.phoneNumber}
                          </p>
                          <button 
                            className="ml-2 text-primary text-xs font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(method.phoneNumber as string);
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
        
        {/* Payment History */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Payment History</h2>
          
          <motion.div 
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {paymentHistory.map((payment) => (
              <motion.div
                key={payment.id}
                variants={itemVariants}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{payment.tournament}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(payment.date).toLocaleDateString()} · {payment.method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₪{payment.amount}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      payment.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : payment.status === 'refunded'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="border-t border-gray-100 mt-3 pt-3 text-right">
                  <button
                    className="text-primary text-sm font-medium"
                    onClick={() => toastRef.current?.showToast('Receipt view coming soon!', 'info')}
                  >
                    View Receipt
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </MobilePageLayout>
      
      {/* Toast Container */}
      <ToastContainer ref={toastRef} position="bottom-center" />
    </div>
  );
} 