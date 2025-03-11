"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/app/hooks/use-auth"
import { toast } from "sonner"

interface AdminEditButtonProps {
  entityId: string
  entityType: 'player' | 'tournament' | 'match'
  small?: boolean
  showDelete?: boolean
  onDelete?: () => Promise<void>
}

export function AdminEditButton({ 
  entityId, 
  entityType, 
  small = false, 
  showDelete = false,
  onDelete
}: AdminEditButtonProps) {
  const { isAdmin } = useAuth()
  
  // Early return if not admin - hide the button completely
  if (!isAdmin) return null
  
  const getEditUrl = () => {
    if (entityType === 'player') return `/players/${entityId}/edit`
    if (entityType === 'tournament') return `/tournaments/${entityId}/edit`
    if (entityType === 'match') return `/matches/${entityId}/edit`
    return '/'
  }
  
  const handleDelete = async () => {
    if (!onDelete) return
    
    try {
      // Try to get admin token
      const adminToken = localStorage.getItem('adminToken')
      
      // Make sure user is admin and has token
      if (!isAdmin || !adminToken) {
        toast.error("אין לך הרשאות מנהל לביצוע פעולה זו")
        return
      }
      
      // Confirm before deletion
      if (confirm(`האם אתה בטוח שברצונך למחוק את ${entityType === 'player' ? 'השחקן' : entityType === 'tournament' ? 'הטורניר' : 'המשחק'}?`)) {
        await onDelete()
      }
    } catch (error) {
      console.error('Error deleting entity:', error)
      toast.error("אירעה שגיאה במחיקת הפריט")
    }
  }
  
  return (
    <div className="flex gap-2">
      <Link href={getEditUrl()}>
        <Button 
          variant={small ? "ghost" : "default"} 
          size={small ? "icon" : "default"}
          className={small ? "h-7 w-7" : ""}
        >
          <Edit className={small ? "h-3.5 w-3.5" : "h-4 w-4 mr-2"} />
          {!small && "ערוך"}
        </Button>
      </Link>
      
      {showDelete && onDelete && (
        <Button 
          variant={small ? "ghost" : "destructive"} 
          size={small ? "icon" : "default"}
          className={small ? "h-7 w-7" : ""}
          onClick={handleDelete}
        >
          <Trash2 className={small ? "h-3.5 w-3.5" : "h-4 w-4 mr-2"} />
          {!small && "מחק"}
        </Button>
      )}
    </div>
  )
} 