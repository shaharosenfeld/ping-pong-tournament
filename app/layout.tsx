import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/Navbar"
import { Sidebar } from "@/components/Sidebar"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "טורניר פינג פונג מקצועי",
  description: "מערכת ניהול טורנירי פינג פונג מתקדמת עם תצוגה דינמית ואינטראקטיבית",
  keywords: "פינג פונג, טורניר, ספורט, ניהול טורנירים, טניס שולחן",
  icons: {
    icon: "/paddlebot-logo.png",
    apple: "/paddlebot-logo.png",
    shortcut: "/paddlebot-logo.png"
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  themeColor: "#2563eb",
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 overflow-x-hidden`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <div className="relative min-h-screen bg-background">
              <Navbar />
              <div className="flex flex-col lg:flex-row">
                <Sidebar />
                <main className="flex-1 w-full p-4 pb-24 lg:p-6 lg:mr-64">{children}</main>
              </div>
            </div>
          </Providers>
          <SonnerToaster position="top-center" expand={true} richColors />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}