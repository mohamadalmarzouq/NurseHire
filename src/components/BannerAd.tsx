'use client'

import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'

interface Banner {
  id: string
  title: string
  imageUrl: string
  linkUrl?: string
  position: 'HOMEPAGE_HERO' | 'DASHBOARD_HEADER'
  isActive: boolean
  clickCount: number
  impressionCount: number
}

interface BannerAdProps {
  position: 'HOMEPAGE_HERO' | 'DASHBOARD_HEADER'
  className?: string
}

export default function BannerAd({ position, className = '' }: BannerAdProps) {
  const [banner, setBanner] = useState<Banner | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadBanner = async () => {
      try {
        const res = await fetch(`/api/banners?position=${position}`)
        if (res.ok) {
          const data = await res.json()
          const banners = data.banners || []
          if (banners.length > 0) {
            setBanner(banners[0]) // Show the most recent banner
            // Track impression
            trackImpression(banners[0].id)
          }
        }
      } catch (error) {
        console.error('Error loading banner:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadBanner()
  }, [position])

  const trackImpression = async (bannerId: string) => {
    try {
      await fetch(`/api/banners/${bannerId}/impression`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error tracking impression:', error)
    }
  }

  const trackClick = async (bannerId: string) => {
    try {
      await fetch(`/api/banners/${bannerId}/click`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error tracking click:', error)
    }
  }

  const handleBannerClick = () => {
    if (banner?.linkUrl) {
      trackClick(banner.id)
      window.open(banner.linkUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (isLoading) {
    return null
  }

  if (!banner) {
    return null
  }

  const isClickable = !!banner.linkUrl

  return (
    <div className={`banner-ad ${className}`}>
      <div
        className={`relative group ${isClickable ? 'cursor-pointer' : ''}`}
        onClick={isClickable ? handleBannerClick : undefined}
      >
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className={`w-full object-cover rounded-lg transition-transform duration-200 ${
            isClickable ? 'group-hover:scale-105' : ''
          }`}
          style={{
            height: position === 'HOMEPAGE_HERO' ? '300px' : '150px',
          }}
        />
        
        {isClickable && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ExternalLink className="w-6 h-6 text-white" />
            </div>
          </div>
        )}
        
        {/* Ad label */}
        <div className="absolute top-2 right-2">
          <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            Ad
          </span>
        </div>
      </div>
    </div>
  )
}
