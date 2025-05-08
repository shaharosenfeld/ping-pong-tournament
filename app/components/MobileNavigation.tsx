import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Home, 
  User, 
  CalendarDays, 
  Trophy, 
  CreditCard, 
  Menu, 
  X, 
  ChevronRight, 
  LogOut
} from 'lucide-react';
import { usePathname } from 'next/navigation';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  subItems?: Array<{
    label: string;
    href: string;
  }>;
};

export default function MobileNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const pathname = usePathname();
  
  const navItems: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Profile', href: '/profile', icon: User },
    { 
      label: 'Tournaments', 
      href: '/tournaments', 
      icon: Trophy,
      subItems: [
        { label: 'Upcoming', href: '/tournaments/upcoming' },
        { label: 'Past', href: '/tournaments/past' },
        { label: 'My Tournaments', href: '/tournaments/my-tournaments' },
      ]
    },
    { label: 'Calendar', href: '/calendar', icon: CalendarDays },
    { label: 'Payments', href: '/payments', icon: CreditCard },
  ];
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const toggleExpandItem = (label: string) => {
    if (expandedItem === label) {
      setExpandedItem(null);
    } else {
      setExpandedItem(label);
    }
  };
  
  // Animation variants
  const menuVariants = {
    closed: {
      x: '-100%',
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    open: {
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    }
  };
  
  const itemVariants = {
    closed: { x: -20, opacity: 0 },
    open: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: { delay: i * 0.1, duration: 0.3 }
    })
  };
  
  const backdropVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 }
  };

  return (
    <>
      <button 
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg touch-target ios-tap-fix"
        onClick={toggleMenu}
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            initial="closed"
            animate="open"
            exit="closed"
            variants={backdropVariants}
            onClick={toggleMenu}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav
            className="fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[80vw] bg-white shadow-xl flex flex-col"
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
          >
            <div className="p-6 border-b flex items-center">
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                  PP
                </span>
                <span className="text-xl font-bold">Ping Pong</span>
              </Link>
            </div>
            
            <div className="flex-1 overflow-y-auto ios-scroll py-2">
              <ul className="space-y-1 p-2">
                {navItems.map((item, i) => (
                  <motion.li 
                    key={item.label}
                    custom={i}
                    variants={itemVariants}
                  >
                    {item.subItems ? (
                      <div>
                        <button
                          className={`flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50 text-left touch-target ${
                            pathname.startsWith(item.href) ? 'bg-gray-50 font-medium' : ''
                          }`}
                          onClick={() => toggleExpandItem(item.label)}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon size={20} className="text-gray-500" />
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight
                            size={20}
                            className={`transition-transform ${
                              expandedItem === item.label ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                        
                        <AnimatePresence>
                          {expandedItem === item.label && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="ml-9 mt-1 overflow-hidden"
                            >
                              {item.subItems.map((subItem) => (
                                <li key={subItem.label}>
                                  <Link
                                    href={subItem.href}
                                    className={`block p-3 rounded-lg hover:bg-gray-50 touch-target ${
                                      pathname === subItem.href ? 'text-primary font-medium' : ''
                                    }`}
                                    onClick={() => setIsMenuOpen(false)}
                                  >
                                    {subItem.label}
                                  </Link>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 touch-target ${
                          pathname === item.href ? 'bg-gray-50 font-medium' : ''
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <item.icon size={20} className="text-gray-500" />
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </motion.li>
                ))}
              </ul>
            </div>
            
            <div className="p-4 border-t">
              <button 
                className="flex w-full items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 touch-target"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
} 