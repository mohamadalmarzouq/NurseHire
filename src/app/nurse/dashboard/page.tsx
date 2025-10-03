'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, MessageCircle, Star, User, Settings, LogOut, Eye, Edit, Clock } from 'lucide-react'

export default function NurseDashboard() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!res.ok) {
          window.location.href = '/auth/login'
          return
        }
        const data = await res.json()
        if (data?.authenticated) setUser(data.user)
      } catch (e) {
        console.error(e)
        window.location.href = '/auth/login'
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
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

  const isApproved = user?.profile?.status === 'APPROVED'

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
              <span className="text-gray-700">Welcome, {user?.profile?.name || 'Nurse'}!</span>
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
        {/* Approval Status */}
        {!isApproved && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Profile Pending Approval</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your profile is under review. You'll receive an email notification once approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to your dashboard, {user?.profile?.name || 'Nurse'}!
          </h1>
          <p className="text-gray-600">
            {isApproved 
              ? 'Manage your profile and respond to booking requests from mothers.'
              : 'Complete your profile setup and wait for admin approval.'
            }
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/nurse/profile" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-primary-100 p-3 rounded-lg">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">My Profile</h3>
                <p className="text-gray-600 text-sm">View and edit profile</p>
              </div>
            </div>
          </Link>

          <Link href="/nurse/bookings" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Bookings</h3>
                <p className="text-gray-600 text-sm">Manage requests</p>
              </div>
            </div>
          </Link>

          <Link href="/nurse/messages" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
                <p className="text-gray-600 text-sm">Chat with mothers</p>
              </div>
            </div>
          </Link>

          <Link href="/nurse/reviews" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
                <p className="text-gray-600 text-sm">View ratings</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Profile Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Experience</span>
                <span className="text-sm font-medium text-gray-900">{user?.profile?.totalExperience || 0} years</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Kuwait Experience</span>
                <span className="text-sm font-medium text-gray-900">{user?.profile?.kuwaitExperience || 0} years</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Part-time Rate</span>
                <span className="text-sm font-medium text-gray-900">KD {user?.profile?.partTimeSalary || 0}/hour</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Night Shift Rate</span>
                <span className="text-sm font-medium text-gray-900">KD {user?.profile?.nightShiftSalary || 0}/hour</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Languages</span>
                <span className="text-sm font-medium text-gray-900">
                  {user?.profile?.languages?.join(', ') || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Availability</span>
                <span className="text-sm font-medium text-gray-900">
                  {user?.profile?.availability?.join(', ') || 'Not specified'}
                </span>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Link href="/nurse/profile" className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-center">
                <Edit className="w-4 h-4 inline mr-1" />
                Edit Profile
              </Link>
                      <Link 
                        href="/nurse/public-profile"
                        className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        View Public
                      </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-400 pl-4 py-2">
                <p className="text-sm text-gray-600">Profile created</p>
                <p className="text-xs text-gray-500">Waiting for admin approval</p>
              </div>
              {isApproved && (
                <>
                  <div className="border-l-4 border-green-400 pl-4 py-2">
                    <p className="text-sm text-gray-600">Profile approved</p>
                    <p className="text-xs text-gray-500">Now visible to mothers</p>
                  </div>
                  <div className="border-l-4 border-yellow-400 pl-4 py-2">
                    <p className="text-sm text-gray-600">No booking requests yet</p>
                    <p className="text-xs text-gray-500">Mothers can now book you</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information */}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">About Me</label>
              <p className="mt-1 text-sm text-gray-900">{user?.profile?.aboutMe || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
