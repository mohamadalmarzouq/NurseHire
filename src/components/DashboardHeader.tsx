'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Heart, LogOut, Settings } from 'lucide-react'

interface DashboardHeaderProps {
  userName?: string
  userRole?: string
}

export default function DashboardHeader({ userName, userRole }: DashboardHeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data?.authenticated) {
            setIsLoggedIn(true)
            setCurrentUser(data.user)
          }
        }
      } catch (e) {
        // Not logged in
      }
    }
    checkAuth()
  }, [])

  const handleSignOut = () => {
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    window.location.href = '/'
  }

  return (
    <header className="bg-white shadow-soft sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">NurseHire</span>
          </Link>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-6">
            {isLoggedIn && currentUser && (
              <>
                <div className="hidden md:flex items-center">
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Welcome, {currentUser?.profile?.name || currentUser?.name || 'User'}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
