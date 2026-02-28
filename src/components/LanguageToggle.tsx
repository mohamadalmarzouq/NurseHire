'use client'

import { useLanguage } from '@/lib/language'
import { Globe } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'ar' as const, name: 'العربية', flag: '🇰🇼' },
  ]

  const currentLang = languages.find(lang => lang.code === language) || languages[0]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-[#CFEFF4] bg-[#F2FCFD] hover:bg-[#E6FAFC] transition-colors shadow-sm"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4 text-cyan-700" />
        <span className="text-sm font-semibold text-cyan-800">{currentLang.flag} {currentLang.name}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-[#CFEFF4] py-2 min-w-[150px] z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F2FCFD] transition-colors flex items-center space-x-2 ${
                language === lang.code ? 'bg-[#E6FAFC] text-cyan-700' : 'text-neutral-700'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
              {language === lang.code && (
                <span className="ml-auto text-cyan-700">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

