import { Table as TableTennis } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative animate-bounce">
        <TableTennis className="h-12 w-12 text-primary" />
        <div className="absolute inset-0 animate-ping">
          <TableTennis className="h-12 w-12 text-primary/20" />
        </div>
      </div>
      <h2 className="text-xl font-medium mt-6">טוען...</h2>
      <p className="text-muted-foreground mt-2">אנא המתן בזמן שאנו טוענים את הנתונים</p>
    </div>
  )
}

