import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div
      dir="rtl"
      className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-b from-blue-50 to-white"
    >
      <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
      <h2 className="text-xl font-medium text-blue-700">טוען טורנירים...</h2>
      <p className="text-blue-500 mt-2">אנא המתן בזמן שאנו טוענים את נתוני הטורנירים</p>
    </div>
  )
}

