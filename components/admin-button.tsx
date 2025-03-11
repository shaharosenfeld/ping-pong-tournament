"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Plus } from "lucide-react"
import { useAuth } from "@/app/hooks/use-auth"

export default function AdminButton() {
  const { isAdmin } = useAuth()
  const [currentPath, setCurrentPath] = useState("")

  useEffect(() => {
    // קבלת הנתיב הנוכחי
    setCurrentPath(window.location.pathname)
  }, [])

  if (!isAdmin) {
    return null
  }

  // הוספת כפתור יצירה בהתאם לדף הנוכחי
  const renderCreateButton = () => {
    if (currentPath === "/tournaments" || currentPath === "/tournaments/") {
      return (
        <Link href="/tournaments/new">
          <Button className="gap-2 bg-green-500 hover:bg-green-600 text-white">
            <Plus className="h-4 w-4" />
            צור טורניר
          </Button>
        </Link>
      )
    } else if (currentPath === "/players" || currentPath === "/players/") {
      return (
        <Link href="/players/new">
          <Button className="gap-2 bg-green-500 hover:bg-green-600 text-white">
            <Plus className="h-4 w-4" />
            הוסף שחקן
          </Button>
        </Link>
      )
    } else if (currentPath === "/matches" || currentPath === "/matches/") {
      return (
        <Link href="/matches/new">
          <Button className="gap-2 bg-green-500 hover:bg-green-600 text-white">
            <Plus className="h-4 w-4" />
            צור משחק
          </Button>
        </Link>
      )
    }

    return null
  }

  return (
    <div className="flex gap-2">
      {renderCreateButton()}
      <Link href="/admin">
        <Button variant="outline" className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-100">
          <Shield className="h-4 w-4" />
          ניהול
        </Button>
      </Link>
    </div>
  )
}

