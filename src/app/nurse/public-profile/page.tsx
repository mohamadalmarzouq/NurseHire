'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, User } from 'lucide-react'

interface Nurse {
  id: string
  name: string
  age: number
  totalExperience: number
  kuwaitExperience: number
  partTimeSalary: number
  nightShiftSalary: number
  aboutMe: string
  profileImageUrl?: string
  averageRating: number
  reviewCount: number
  languages: string[]
  availability: string[]
}

export default function NursePublicProfilePage() {
  const [nurse, setNurse] = useState<Nurse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadNurseProfile = async () => {
      try {
        // Get current user's nurse profile
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!res.ok) {
          window.location.href = '/auth/login'
          return
        }
        const data = await res.json()
        console.log('Auth data:', data) // Debug log
        if (data?.authenticated && data.user?.profile) {
          const profile = data.user.profile
          console.log('Profile data:', profile) // Debug log
          setNurse({
            id: data.user.id,
            name: profile.name,
            age: profile.age,
            totalExperience: profile.totalExperience,
            kuwaitExperience: profile.kuwaitExperience,
            partTimeSalary: profile.partTimeSalary,
            nightShiftSalary: profile.nightShiftSalary,
            aboutMe: profile.aboutMe || 'No description provided',
            profileImageUrl: profile.profileImageUrl,
            averageRating: 0, // Will be calculated from reviews later
            reviewCount: 0, // Will be calculated from reviews later
            languages: profile.languages || [],
            availability: profile.availability || [],
          })
        } else {
          console.log('No profile found or not authenticated')
          console.log('Authenticated:', data?.authenticated)
          console.log('User:', data?.user)
          console.log('Profile:', data?.user?.profile)
        }
      } catch (e) {
        console.error('Error loading nurse profile:', e)
        window.location.href = '/auth/login'
      } finally {
        setIsLoading(false)
      }
    }
    loadNurseProfile()
  }, [])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-neutral-300'
        }`}
      />
    ))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!nurse) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Profile not found</h2>
          <p className="text-neutral-600 mb-6">Unable to load your profile.</p>
          <Link href="/nurse/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Simple Header - No Navigation */}
      <div className="bg-white shadow-soft">
        <div className="container-custom py-6">
          <div className="flex items-center justify-between">
            <Link href="/nurse/dashboard" className="flex items-center text-neutral-600 hover:text-neutral-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-neutral-600">Your Public Profile</span>
              <button 
                onClick={() => {
                  document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
                  window.location.href = '/auth/login'
                }}
                className="text-red-500 hover:text-red-700 transition-colors flex items-center"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Header */}
            <div className="card">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {nurse.profileImageUrl ? (
                    <img
                      src={nurse.profileImageUrl}
                      alt={nurse.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-primary-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">{nurse.name}</h1>
                  <p className="text-lg text-neutral-600 mb-4">
                    {nurse.age} years old • {nurse.totalExperience} years experience
                  </p>
                  <div className="flex items-center space-x-1 mb-4">
                    {renderStars(nurse.averageRating)}
                    <span className="text-lg font-semibold text-neutral-900 ml-2">
                      {nurse.averageRating}
                    </span>
                    <span className="text-neutral-600 ml-2">
                      ({nurse.reviewCount} reviews)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {nurse.availability.map((avail) => (
                      <span
                        key={avail}
                        className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                      >
                        {avail}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="card">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">About {nurse.name}</h2>
              <p className="text-neutral-600 leading-relaxed">{nurse.aboutMe}</p>
            </div>

            {/* Experience & Skills */}
            <div className="card">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Experience & Skills</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-3">Experience</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Total Experience</span>
                      <span className="font-medium">{nurse.totalExperience} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Kuwait Experience</span>
                      <span className="font-medium">{nurse.kuwaitExperience} years</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-3">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {nurse.languages.length > 0 ? (
                      nurse.languages.map((language) => (
                        <span
                          key={language}
                          className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm"
                        >
                          {language}
                        </span>
                      ))
                    ) : (
                      <span className="text-neutral-500 text-sm">No languages specified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="card">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Reviews ({nurse.reviewCount})</h2>
              {nurse.reviewCount === 0 ? (
                <p className="text-neutral-500 text-center py-8">No reviews yet</p>
              ) : (
                <p className="text-neutral-500 text-center py-8">Reviews will appear here once mothers rate your services</p>
              )}
            </div>
          </div>

          {/* Sidebar - Read Only Pricing */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">Pricing</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Part-time Rate</span>
                  <span className="text-xl font-bold text-primary-600">
                    {nurse.partTimeSalary} KD/hour
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Night Shift Rate</span>
                  <span className="text-xl font-bold text-primary-600">
                    {nurse.nightShiftSalary} KD/hour
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center text-sm text-neutral-600">
                  <span className="w-4 h-4 mr-2 text-green-500">✓</span>
                  MOH License Verified
                </div>
                <div className="flex items-center text-sm text-neutral-600">
                  <span className="w-4 h-4 mr-2 text-blue-500">✓</span>
                  Background Checked
                </div>
                <div className="flex items-center text-sm text-neutral-600">
                  <span className="w-4 h-4 mr-2 text-red-500">♥</span>
                  {nurse.reviewCount} Reviews
                </div>
              </div>

              <div className="text-center text-sm text-neutral-500 bg-neutral-50 p-4 rounded-lg">
                This is how your profile appears to mothers
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
