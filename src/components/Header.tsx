'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, User, Heart, Shield } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
            <Link href="/auth/login" className="text-neutral-600 hover:text-primary-600 transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register" className="btn-primary">
              Get Started
            </Link>
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
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
