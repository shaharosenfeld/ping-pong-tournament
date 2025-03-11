"use client"

import React from "react"
import AdminCheck from "../../components/admin-check"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // מחזיר ישירות את AdminCheck בלי לוגיקה נוספת
  // AdminCheck ידאג לבדוק אם המשתמש מורשה או לא
  return <AdminCheck>{children}</AdminCheck>;
} 