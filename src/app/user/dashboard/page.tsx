'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Heart, MessageCircle, Star, Calendar, User, Settings, LogOut } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

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
            <span className="nh-badge nh-badge--ok">MOH Verified</span>
            <span className="nh-badge nh-badge--info">Private & Secure</span>
            <span className="nh-badge nh-badge--warn">No Payments (Phase 1)</span>
          </div>
        </div>
        {/* Welcome Section */}
        <div className="nh-card mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold text-primary-600">{(user?.profile?.name || 'M').charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="nh-h2" style={{marginBottom:'2px'}}>Welcome, {user?.profile?.name || 'Mother'}</h1>
              <span className="nh-badge nh-badge--info capitalize" style={{fontSize:'11px'}}>mother</span>
            </div>
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

          <Link href="/user/bookings" className="group nh-card nh-card--lift p-6" style={{
            background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
            border: '1px solid #BBF7D0',
            transition: 'all 0.3s ease'
          }}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-2xl" style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)'
              }}>
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2" style={{color: '#047857'}}>My Bookings</h3>
                <p className="text-sm mb-3" style={{color: '#047857', opacity: 0.8}}>View booking requests</p>
                <div className="text-xs font-medium" style={{color: '#047857', opacity: 0.7}}>
                  Manage your schedule →
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
            <h2 className="nh-h2" style={{fontSize:'18px',marginBottom:'10px'}}>Recent Nurses</h2>
            <div className="space-y-4">
              {recentNurses.length === 0 ? (
                <div className="border-l-4 border-yellow-400 pl-4 py-2">
                  <p className="text-sm text-gray-600">No approved nurses available</p>
                  <p className="text-xs text-gray-500">Check back later for new nurses</p>
                </div>
              ) : (
                recentNurses.map((nurse) => (
                  <div key={nurse.id} className="border-l-4 border-green-400 pl-4 py-2">
                    <p className="text-sm font-medium text-gray-900">{nurse.name}</p>
                    <p className="text-xs text-gray-500">
                      {nurse.totalExperience} years experience • KD {nurse.partTimeSalary}/hour
                    </p>
                    <Link 
                      href={`/nurses/${nurse.id}`}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      View Profile
                    </Link>
                  </div>
                ))
              )}
            </div>
            <Link href="/nurses" className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700">
              Find nurses <Search className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {/* Favorites */}
          <div className="nh-card">
            <h2 className="nh-h2" style={{fontSize:'18px',marginBottom:'10px'}}>Favorite Nurses</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-red-400 pl-4 py-2">
                <p className="text-sm text-gray-600">No favorite nurses yet</p>
                <p className="text-xs text-gray-500">Add nurses to your favorites</p>
              </div>
            </div>
            <Link href="/nurses" className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700">
              Browse nurses <Heart className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Profile Section */}
        <div className="mt-8 nh-card">
          <h2 className="nh-h2" style={{fontSize:'18px',marginBottom:'10px'}}>Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-sm text-gray-900">{user?.profile?.name || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user?.email || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="mt-1 text-sm text-gray-900">{user?.profile?.phone || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <p className="mt-1 text-sm text-gray-900">{user?.profile?.location || 'Not set'}</p>
            </div>
          </div>
          <Link href="/user/profile" className="mt-4 inline-block nh-btn nh-btn--primary">Edit Profile</Link>
        </div>
      </div>
    </div>
  )
}
