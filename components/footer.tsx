import Link from "next/link"
import { Trophy } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-xl">טורניר פינג פונג</span>
            </div>
            <p className="text-muted-foreground text-sm">
              מערכת ניהול טורנירי פינג פונג מתקדמת המאפשרת ניהול ליגות, טורנירי נוקאאוט ובתים, ומעקב אחר דירוג השחקנים.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">קישורים מהירים</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  דף הבית
                </Link>
              </li>
              <li>
                <Link href="/tournaments" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  טורנירים
                </Link>
              </li>
              <li>
                <Link href="/players" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  שחקנים
                </Link>
              </li>
              <li>
                <Link href="/stats" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  סטטיסטיקות
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">מידע נוסף</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  אודות
                </Link>
              </li>
              <li>
                <Link href="/rules" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  חוקי המשחק
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  צור קשר
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} טורניר פינג פונג. כל הזכויות שמורות.
          </p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              <span className="sr-only">פייסבוק</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              <span className="sr-only">אינסטגרם</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              <span className="sr-only">טוויטר</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
} 