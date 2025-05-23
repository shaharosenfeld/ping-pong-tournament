import type React from "react"
import AdminCheck from "@/components/admin-check"

export default function NewTournamentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminCheck>{children}</AdminCheck>
}

