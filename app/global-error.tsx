'use client'

import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#B91C1C', marginBottom: '1rem', fontSize: '1.5rem' }}>
            שגיאה קריטית
          </h1>
          <p style={{ color: '#1E40AF', marginBottom: '2rem', maxWidth: '500px' }}>
            אירעה שגיאה קריטית במערכת. אנא נסה לרענן את הדף.
          </p>
          <div>
            <button
              onClick={() => reset()}
              style={{
                backgroundColor: '#2563EB',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                marginRight: '0.5rem'
              }}
            >
              נסה שוב
            </button>
            <a
              href="/"
              style={{
                border: '1px solid #93C5FD',
                color: '#2563EB',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              חזרה לדף הבית
            </a>
          </div>
        </div>
      </body>
    </html>
  )
} 