'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, Save, Edit, LogOut } from 'lucide-react'

export default function MotherProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    aboutMe: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!res.ok) {
          window.location.href = '/auth/login'
          return
        }
        const data = await res.json()
        if (data?.authenticated) {
          setUser(data.user)
          const profile = data.user.motherProfile
          setFormData({
            name: profile?.name || '',
            phone: profile?.phone || '',
            location: profile?.location || '',
            aboutMe: profile?.aboutMe || '',
          })
        }
      } catch (e) {
        console.error(e)
        window.location.href = '/auth/login'
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')
    
    try {
      const res = await fetch('/api/mother/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        throw new Error('Failed to update profile')
      }

      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      
      // Reload user data
      const userRes = await fetch('/api/auth/me', { cache: 'no-store' })
      if (userRes.ok) {
        const userData = await userRes.json()
        if (userData?.authenticated) setUser(userData.user)
      }
    } catch (err) {
      setError('Failed to update profile. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">Authentication failed. Please log in again.</p>
          <Link href="/auth/login" className="mt-4 inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                NurseHire
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/mother/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/mother/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your mother profile information</p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" /> Edit Profile
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm mb-4">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center">
              <img
                src={user?.motherProfile?.profileImageUrl || '/default-avatar.png'}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-primary-100 shadow-md"
              />
              {isEditing && (
                <button className="mt-3 text-primary-600 hover:underline text-sm">
                  Change Profile Image
                </button>
              )}
            </div>

            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full input-field"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{user?.motherProfile?.name || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-gray-900">{user?.email || 'Not set'}</p>
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1 block w-full input-field"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{user?.motherProfile?.phone || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="mt-1 block w-full input-field"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{user?.motherProfile?.location || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* About Me */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About Me</h2>
            {isEditing ? (
              <textarea
                name="aboutMe"
                value={formData.aboutMe}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full input-field"
                placeholder="Tell nurses about yourself and your needs..."
              ></textarea>
            ) : (
              <p className="mt-1 text-gray-900">{user?.motherProfile?.aboutMe || 'Not set'}</p>
            )}
          </div>

          {isEditing && (
            <div className="mt-8 flex space-x-4">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-center"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
