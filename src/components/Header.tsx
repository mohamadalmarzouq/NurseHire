'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, User, Heart, Shield, LogOut } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data?.authenticated) {
            setIsLoggedIn(true)
            setUserRole(data.user.role)
          }
        }
      } catch (e) {
        // Not logged in
      }
    }
    checkAuth()
  }, [])

  // Hide header for dashboard pages and caretakers listing
  const isDashboardPage = pathname?.startsWith('/user/') ||
                         pathname?.startsWith('/caretaker/') ||
                         pathname?.startsWith('/admin/') ||
                         pathname === '/caretakers'

  console.log('Header component - pathname:', pathname, 'isDashboardPage:', isDashboardPage)

  if (isDashboardPage) {
    console.log('Header component - returning null for dashboard page')
    return null
  }

  return (
    <header className="bg-white shadow-soft sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 no-underline">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">ENFAS</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/nurses" className="text-neutral-600 hover:text-primary-600 transition-colors">
              Find Nurses
            </Link>
            <Link href="/how-it-works" className="text-neutral-600 hover:text-primary-600 transition-colors">
              How It Works
            </Link>
            <Link href="/safety" className="text-neutral-600 hover:text-primary-600 transition-colors">
              Safety
            </Link>
            <Link href="/about" className="text-neutral-600 hover:text-primary-600 transition-colors">
              About
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Link 
                  href={userRole === 'ADMIN' ? '/admin/dashboard' : userRole === 'CARETAKER' ? '/caretaker/dashboard' : '/mother/dashboard'}
                  className="text-neutral-600 hover:text-primary-600 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
                    window.location.href = '/'
                  }}
                  className="text-red-500 hover:text-red-700 transition-colors flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-neutral-600 hover:text-primary-600 transition-colors">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/nurses" 
                className="text-neutral-600 hover:text-primary-600 transition-colors px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Find Nurses
              </Link>
              <Link 
                href="/how-it-works" 
                className="text-neutral-600 hover:text-primary-600 transition-colors px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                href="/safety" 
                className="text-neutral-600 hover:text-primary-600 transition-colors px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Safety
              </Link>
              <Link 
                href="/about" 
                className="text-neutral-600 hover:text-primary-600 transition-colors px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <div className="border-t border-neutral-200 pt-4 px-4 space-y-2">
                {isLoggedIn ? (
                  <>
                    <Link 
                      href={userRole === 'ADMIN' ? '/admin/dashboard' : userRole === 'CARETAKER' ? '/caretaker/dashboard' : '/mother/dashboard'}
                      className="block text-neutral-600 hover:text-primary-600 transition-colors py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
                        window.location.href = '/'
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-left text-red-500 hover:text-red-700 transition-colors py-2"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/auth/login" 
                      className="block text-neutral-600 hover:text-primary-600 transition-colors py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/auth/register" 
                      className="block btn-primary text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
