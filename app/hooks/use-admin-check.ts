"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        setIsLoading(true);
        
        // Get the admin token from localStorage
        const adminToken = localStorage.getItem('adminToken');
        
        if (!adminToken) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        // Verify the admin token with the server
        const response = await fetch('/api/admin/verify', {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin || false);
        } else {
          setIsAdmin(false);
          localStorage.removeItem('adminToken');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAdminStatus();
  }, []);

  const redirectToLogin = () => {
    router.push('/admin/login');
  };

  return { isAdmin, isLoading, redirectToLogin };
} 