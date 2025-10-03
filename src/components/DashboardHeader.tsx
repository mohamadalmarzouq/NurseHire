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
          <div className="flex items-center space-x-4">
            {isLoggedIn && currentUser && (
              <>
                <div className="hidden md:flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-900">
                      Welcome, {currentUser.name || 'User'}!
                    </p>
                    <p className="text-xs text-neutral-500 capitalize">
                      {currentUser.role?.toLowerCase()}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {(currentUser.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="text-red-500 hover:text-red-700 transition-colors flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
