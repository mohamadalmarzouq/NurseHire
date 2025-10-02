'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Heart, MessageCircle, Star, Calendar, User, Settings, LogOut } from 'lucide-react'

export default function MotherDashboard() {
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                NurseHire
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.profile?.name || 'Mother'}!</span>
              <button className="text-gray-500 hover:text-gray-700">
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
                  window.location.href = '/auth/login'
                }}
                className="text-red-500 hover:text-red-700"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to your dashboard, {user?.profile?.name || 'Mother'}!
          </h1>
          <p className="text-gray-600">
            Find trusted nurses for your newborn care needs in Kuwait.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/nurses" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-primary-100 p-3 rounded-lg">
                <Search className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Find Nurses</h3>
                <p className="text-gray-600 text-sm">Browse available nurses</p>
              </div>
            </div>
          </Link>

          <Link href="/mother/bookings" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">My Bookings</h3>
                <p className="text-gray-600 text-sm">View booking requests</p>
              </div>
            </div>
          </Link>

          <Link href="/mother/messages" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
                <p className="text-gray-600 text-sm">Chat with nurses</p>
              </div>
            </div>
          </Link>

          <Link href="/mother/reviews" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
                <p className="text-gray-600 text-sm">Rate your nurses</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Nurses */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Nurses</h2>
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Favorite Nurses</h2>
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
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
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
          <Link 
            href="/mother/profile"
            className="mt-4 inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
