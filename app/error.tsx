"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative">
        <div className="bg-destructive/10 p-6 rounded-full mb-6">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
      </div>
      <h2 className="text-2xl font-semibold mb-4">אופס! משהו השתבש</h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        אירעה שגיאה בעת טעינת הדף. אנא נסה לרענן את הדף או לחזור לדף הבית.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset} variant="default">
          נסה שוב
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">חזרה לדף הבית</Link>
        </Button>
      </div>
    </div>
  )
}

