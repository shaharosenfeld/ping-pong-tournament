import type React from "react"
import AdminCheck from "@/components/admin-check"

export default function EditPlayerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminCheck>{children}</AdminCheck>
}

