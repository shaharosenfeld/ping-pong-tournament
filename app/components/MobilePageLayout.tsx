import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface MobilePageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  backLink?: string;
  onBack?: () => void;
  footer?: React.ReactNode;
  noPadding?: boolean;
  className?: string;
}

/**
 * A responsive page layout component optimized for mobile
 */
export default function MobilePageLayout({ 
  children, 
  title, 
  subtitle,
  backLink,
  onBack,
  footer,
  noPadding = false,
  className = ''
}: MobilePageLayoutProps) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };
  
  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backLink) {
      window.location.href = backLink;
    } else {
      window.history.back();
    }
  };
  
  return (
    <motion.div 
      className={`w-full mx-auto max-w-3xl overflow-x-hidden ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with title and optional back button */}
      {(title || backLink || onBack) && (
        <motion.div 
          className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur-sm"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between py-3 px-4">
            {(backLink || onBack) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-9 w-9 touch-target"
              >
                <ArrowRight className="h-5 w-5 rtl:rotate-180" />
              </Button>
            )}
            
            {title && (
              <div className="flex-1 text-center">
                <h1 className="text-lg font-semibold truncate max-w-[250px] mx-auto">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            
            {/* Space holder for alignment */}
            {(backLink || onBack) && <div className="w-9"></div>}
          </div>
        </motion.div>
      )}
      
      {/* Main content */}
      <motion.main 
        className={`flex-1 ${!noPadding && 'p-4'}`}
        variants={itemVariants} 
      >
        {children}
      </motion.main>
      
      {/* Footer */}
      {footer && (
        <motion.div 
          className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-sm p-4 safe-area-padding"
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {footer}
        </motion.div>
      )}
    </motion.div>
  );
} 