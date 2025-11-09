'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Heart, MessageCircle, Star, Calendar, User, Settings, LogOut } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import BannerAd from '@/components/BannerAd'

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recentNurses, setRecentNurses] = useState<any[]>([])

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('Loading user from /api/auth/me...')
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        console.log('Auth me response status:', res.status)
        
        if (!res.ok) {
          console.log('Auth me failed, redirecting to login')
          window.location.href = '/auth/login'
          return
        }
        
        const data = await res.json()
        console.log('Auth me data:', data)
        
        if (data?.authenticated) {
          setUser(data.user)
        } else {
          console.log('Not authenticated, redirecting to login')
          window.location.href = '/auth/login'
        }
      } catch (e) {
        console.error('Error loading user:', e)
        window.location.href = '/auth/login'
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    const loadRecentNurses = async () => {
      try {
        const res = await fetch('/api/nurses?limit=3', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setRecentNurses(data.nurses || [])
        }
      } catch (e) {
        console.error('Error loading recent nurses:', e)
      }
    }
    loadRecentNurses()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userName={user?.profile?.name} userRole={user?.role} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trust strip */}
        <div className="nh-card mb-6" style={{background:'linear-gradient(90deg,#F0F9FF,#ECFDF5)'}}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="nh-badge nh-badge--ok">Verified</span>
            <span className="nh-badge nh-badge--info">Private & Secure</span>
          </div>
        </div>

        {/* Banner Ad - Dashboard Header */}
        <div className="mb-8">
          <BannerAd position="DASHBOARD_HEADER" />
        </div>

        {/* Welcome Section */}
        <div className="nh-card mb-8">
          <div className="mb-2">
            <h1 className="nh-h2">Welcome, {user?.profile?.name || 'User'}</h1>
          </div>
          <p className="nh-sub">Find trusted nurses for your newborn care needs in Kuwait.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/nurses" className="group nh-card nh-card--lift p-6" style={{
            background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
            border: '1px solid #BAE6FD',
            transition: 'all 0.3s ease'
          }}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-2xl" style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                boxShadow: '0 6px 16px rgba(59, 130, 246, 0.3)'
              }}>
                <Search className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2" style={{color: '#1E40AF'}}>Find Nurses</h3>
                <p className="text-sm mb-3" style={{color: '#1E40AF', opacity: 0.8}}>Browse available nurses</p>
                <div className="text-xs font-medium" style={{color: '#1E40AF', opacity: 0.7}}>
                  Discover trusted care →
                </div>
              </div>
            </div>
          </Link>

          <Link href="/user/requests" className="group nh-card nh-card--lift p-6" style={{
            background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
            border: '1px solid #BBF7D0',
            transition: 'all 0.3s ease'
          }}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-2xl" style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)'
              }}>
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2" style={{color: '#047857'}}>My Requests</h3>
                <p className="text-sm mb-3" style={{color: '#047857', opacity: 0.8}}>View information requests</p>
                <div className="text-xs font-medium" style={{color: '#047857', opacity: 0.7}}>
                  Track your requests →
                </div>
              </div>
            </div>
          </Link>

          <Link href="/user/messages" className="group nh-card nh-card--lift p-6" style={{
            background: 'linear-gradient(135deg, #FDF4FF 0%, #FAE8FF 100%)',
            border: '1px solid #E9D5FF',
            transition: 'all 0.3s ease'
          }}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-2xl" style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                boxShadow: '0 6px 16px rgba(139, 92, 246, 0.3)'
              }}>
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2" style={{color: '#6B21A8'}}>Messages</h3>
                <p className="text-sm mb-3" style={{color: '#6B21A8', opacity: 0.8}}>Chat with nurses</p>
                <div className="text-xs font-medium" style={{color: '#6B21A8', opacity: 0.7}}>
                  Connect & communicate →
                </div>
              </div>
            </div>
          </Link>

          <Link href="/user/reviews" className="group nh-card nh-card--lift p-6" style={{
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            border: '1px solid #FDE68A',
            transition: 'all 0.3s ease'
          }}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-2xl" style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                boxShadow: '0 6px 16px rgba(245, 158, 11, 0.3)'
              }}>
                <Star className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2" style={{color: '#92400E'}}>Reviews</h3>
                <p className="text-sm mb-3" style={{color: '#92400E', opacity: 0.8}}>Rate your nurses</p>
                <div className="text-xs font-medium" style={{color: '#92400E', opacity: 0.7}}>
                  Share your experience →
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Nurses */}
          <div className="nh-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="nh-h2" style={{ fontSize: '18px', marginBottom: '4px' }}>Recent Nurses</h2>
                <p className="text-xs text-gray-500">Latest approved nurses ready to assist your family</p>
              </div>
              <Link
                href="/nurses"
                className="inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                View all
                <Search className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {recentNurses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-yellow-300 bg-yellow-50/60 p-6 text-center">
                <p className="text-sm font-medium text-yellow-800 mb-1">No nurses available yet</p>
                <p className="text-xs text-yellow-700">
                  We&apos;re reviewing new applications daily. Please check back soon.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentNurses.map((nurse) => (
                  <div
                    key={nurse.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white/70 px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center border border-primary-100">
                          <span className="text-sm font-semibold text-primary-600">
                            {nurse.name
                              ? nurse.name
                                  .split(' ')
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((part: string) => part[0])
                                  .join('')
                                  .toUpperCase()
                              : 'N'}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{nurse.name || 'Nurse'}</p>
                        <p className="text-xs text-gray-500">
                          {nurse.totalExperience} yrs experience · KD {nurse.partTimeSalary}/hr
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/nurses/${nurse.id}`}
                      className="inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      View Profile
                      <span className="ml-1 text-lg leading-none">→</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Favorites */}
          <div className="nh-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="nh-h2" style={{ fontSize: '18px', marginBottom: '4px' }}>Favorite Nurses</h2>
                <p className="text-xs text-gray-500">
                  Keep your top nurses handy for quick booking when you need them most
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                <Heart className="w-3 h-3" />
                Favorites
              </span>
            </div>

            <div className="rounded-xl border border-dashed border-red-300 bg-red-50/60 p-6 text-center">
              <Heart className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-red-700 mb-1">No favorites yet</p>
              <p className="text-xs text-red-600 mb-4">
                Tap the heart icon on any nurse profile to add them to this list and access them faster next time.
              </p>
              <Link
                href="/nurses"
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-600 transition-colors"
              >
                Browse nurses
                <Heart className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="mt-8 nh-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
              <h2 className="nh-h2" style={{ fontSize: '18px', marginBottom: '4px' }}>Profile Information</h2>
              <p className="text-xs text-gray-500">
                Keep your details up to date so nurses can learn more about your family&apos;s needs
              </p>
            </div>
            <Link
              href="/user/profile"
              className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              <span>Edit Profile</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 bg-white/60 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Name</p>
              <p className="text-sm font-semibold text-gray-900">{user?.profile?.name || 'Not set'}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white/60 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Email</p>
              <p className="text-sm font-semibold text-gray-900 break-words">{user?.email || 'Not set'}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white/60 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Phone</p>
              <p className="text-sm font-semibold text-gray-900">{user?.profile?.phone || 'Not set'}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white/60 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Location</p>
              <p className="text-sm font-semibold text-gray-900">{user?.profile?.location || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
