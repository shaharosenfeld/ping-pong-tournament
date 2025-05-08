import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  id: string;
  onClose: (id: string) => void;
}

export interface ToastRef {
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

const Toast = ({ message, type, duration = 3000, id, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-white" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-white" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-white" />;
      case 'info':
        return <Info className="h-5 w-5 text-white" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-700';
    }
  };

  return (
    <motion.div
      className={`flex items-center p-3 rounded-lg shadow-lg ${getBackgroundColor()} text-white max-w-[90vw] w-full mx-auto my-2`}
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      layout
    >
      <span className="mr-2">{getIcon()}</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="ml-3 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition"
        aria-label="Close notification"
      >
        <X className="h-4 w-4 text-white" />
      </button>
    </motion.div>
  );
};

export const ToastContainer = forwardRef<ToastRef, { position?: string }>(
  ({ position = 'bottom-center' }, ref) => {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const showToast = (message: string, type: ToastType, duration = 3000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prevToasts) => [...prevToasts, { message, type, duration, id, onClose }]);
    };

    const onClose = (id: string) => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    };

    useImperativeHandle(ref, () => ({
      showToast,
    }));

    // Position styles
    const getPositionClasses = () => {
      switch (position) {
        case 'top-center':
          return 'top-0 left-1/2 transform -translate-x-1/2 pt-4';
        case 'top-left':
          return 'top-0 left-0 pt-4 pl-4';
        case 'top-right':
          return 'top-0 right-0 pt-4 pr-4';
        case 'bottom-left':
          return 'bottom-0 left-0 pb-4 pl-4';
        case 'bottom-right':
          return 'bottom-0 right-0 pb-4 pr-4';
        case 'bottom-center':
        default:
          return 'bottom-0 left-1/2 transform -translate-x-1/2 pb-4';
      }
    };

    return (
      <div
        className={`fixed z-50 flex flex-col items-center ${getPositionClasses()} safe-area-padding`}
        style={{
          pointerEvents: 'none', // Allow interaction with elements behind
          width: position.includes('center') ? 'auto' : '90vw',
          maxWidth: '400px'
        }}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <div key={toast.id} style={{ pointerEvents: 'auto', width: '100%' }}>
              <Toast {...toast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

ToastContainer.displayName = 'ToastContainer';

// Hook for using the toast
export const useToast = () => {
  const [toastRef, setToastRef] = useState<ToastRef | null>(null);

  const registerToastRef = (ref: ToastRef) => {
    setToastRef(ref);
  };

  const showToast = (message: string, type: ToastType, duration?: number) => {
    if (toastRef) {
      toastRef.showToast(message, type, duration);
    }
  };

  return { registerToastRef, showToast };
}; 