'use client'

import Link from 'next/link'
import { Heart, Mail, Phone, MapPin } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/language'

export default function Footer() {
  const { t } = useLanguage()
  const pathname = usePathname()

  // Hide footer for dashboard pages and care takers listing
  const isDashboardPage = pathname?.startsWith('/user/') ||
                         pathname?.startsWith('/caretaker/') ||
                         pathname?.startsWith('/admin/') ||
                         pathname === '/caretakers'

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
              <span className="text-2xl font-bold">ENFAS</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/caretakers" className="text-neutral-300 hover:text-white transition-colors">
                  {t('common.findCareTakers')}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-neutral-300 hover:text-white transition-colors">
                  {t('common.howItWorks')}
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-neutral-300 hover:text-white transition-colors">
                  {t('footer.safetySecurity')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-neutral-300 hover:text-white transition-colors">
                  {t('footer.aboutUs')}
                </Link>
              </li>
            </ul>
          </div>

          {/* For Care Takers */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('homepage.forCareTakers.title')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/auth/register" className="text-neutral-300 hover:text-white transition-colors">
                  {t('footer.joinAsCareTaker')}
                </Link>
              </li>
              <li>
                <Link href="/caretaker/benefits" className="text-neutral-300 hover:text-white transition-colors">
                  {t('footer.benefits')}
                </Link>
              </li>
              <li>
                <Link href="/caretaker/requirements" className="text-neutral-300 hover:text-white transition-colors">
                  {t('footer.requirements')}
                </Link>
              </li>
              <li>
                <Link href="/caretaker/support" className="text-neutral-300 hover:text-white transition-colors">
                  {t('footer.support')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('footer.contactUs')}</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary-400" />
                <span className="text-neutral-300 text-sm">info@enfas.co</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary-400" />
                <span className="text-neutral-300 text-sm">+965 94427069</span>
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
              {t('footer.copyright')}
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-neutral-400 hover:text-white text-sm transition-colors">
                {t('footer.privacyPolicy')}
              </Link>
              <Link href="/terms" className="text-neutral-400 hover:text-white text-sm transition-colors">
                {t('footer.termsOfService')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
