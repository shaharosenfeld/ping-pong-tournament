import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table as TableTennis } from "lucide-react"

export default function NotFound() {
  return (
    <div className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative">
        <div className="bg-muted p-6 rounded-full mb-6">
          <TableTennis className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <h2 className="text-2xl font-medium mb-4">הדף לא נמצא</h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        מצטערים, הדף שחיפשת לא קיים. ייתכן שהוא הוסר או שהקלדת כתובת שגויה.
      </p>
      <Button variant="default" asChild>
        <Link href="/">
          <TableTennis className="mr-2 h-4 w-4" />
          חזרה לדף הבית
        </Link>
      </Button>
    </div>
  )
}

