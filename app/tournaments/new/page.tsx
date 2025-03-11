"use client"

import { TournamentForm } from '@/components/TournamentForm'
import AdminCheck from '@/components/admin-check'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewTournamentPage() {
  return (
    <AdminCheck>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/tournaments">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">יצירת תחרות חדשה</h1>
        </div>
        
        <TournamentForm mode="create" />
      </div>
    </AdminCheck>
  )
}

