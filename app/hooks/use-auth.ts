import { create } from 'zustand'
import { StateCreator } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
}

// Initialize auth state from localStorage
const getInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false
    }
  }
  
  return {
    isAuthenticated: localStorage.getItem('isAuthenticated') === 'true',
    isAdmin: localStorage.getItem('isAdmin') === 'true',
    isLoading: false
  }
}

const store: StateCreator<AuthState> = (set) => ({
  ...getInitialState(),
  
  login: async (password: string) => {
    set({ isLoading: true })
    
    try {
      // שליחת בקשה לאימות לשרת במקום בדיקה מקומית
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Store in localStorage with try-catch to handle private browsing issues
        try {
          localStorage.setItem('isAuthenticated', 'true')
          localStorage.setItem('isAdmin', 'true')
          localStorage.setItem('adminName', 'מנהל המערכת')
          localStorage.setItem('adminToken', data.token) // שימוש בטוקן מהשרת
        } catch (e) {
          console.error('Failed to store auth in localStorage:', e)
        }
        
        set({ isAuthenticated: true, isAdmin: true, isLoading: false })
        return true
      }
      set({ isLoading: false })
      return false
    } catch (error) {
      console.error('Authentication error:', error)
      set({ isLoading: false })
      return false
    }
  },
  
  logout: () => {
    try {
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('isAdmin')
      localStorage.removeItem('adminName')
      localStorage.removeItem('adminToken')
    } catch (e) {
      console.error('Failed to clear auth from localStorage:', e)
    }
    
    set({ isAuthenticated: false, isAdmin: false, isLoading: false })
  }
})

export const useAuth = create(store) 