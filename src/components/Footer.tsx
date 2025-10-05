'use client'

import Link from 'next/link'
import { Heart, Mail, Phone, MapPin } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()

  // Hide footer for dashboard pages and nurses listing
  const isDashboardPage = pathname?.startsWith('/user/') ||
                         pathname?.startsWith('/nurse/') ||
                         pathname?.startsWith('/admin/') ||
                         pathname === '/nurses'

  if (isDashboardPage) {
    return null
  }
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">NurseHire</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Connecting mothers in Kuwait with qualified, vetted nurses for newborn care. 
              Safe, professional, and caring service for your little ones.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/nurses" className="text-neutral-300 hover:text-white transition-colors">
                  Find Nurses
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-neutral-300 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-neutral-300 hover:text-white transition-colors">
                  Safety & Security
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-neutral-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* For Nurses */}
          <div>
            <h3 className="font-semibold text-lg mb-4">For Nurses</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/nurse/register" className="text-neutral-300 hover:text-white transition-colors">
                  Join as Nurse
                </Link>
              </li>
              <li>
                <Link href="/nurse/benefits" className="text-neutral-300 hover:text-white transition-colors">
                  Benefits
                </Link>
              </li>
              <li>
                <Link href="/nurse/requirements" className="text-neutral-300 hover:text-white transition-colors">
                  Requirements
                </Link>
              </li>
              <li>
                <Link href="/nurse/support" className="text-neutral-300 hover:text-white transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary-400" />
                <span className="text-neutral-300 text-sm">info@nursehire.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary-400" />
                <span className="text-neutral-300 text-sm">+965 1234 5678</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span className="text-neutral-300 text-sm">Kuwait City, Kuwait</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-neutral-400 text-sm">
              © 2024 NurseHire. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-neutral-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-neutral-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
