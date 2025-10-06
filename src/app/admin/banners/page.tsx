'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import FileUpload from '@/components/FileUpload'
import DashboardHeader from '@/components/DashboardHeader'

interface Banner {
  id: string
  title: string
  imageUrl: string
  linkUrl?: string
  position: 'HOMEPAGE_HERO' | 'DASHBOARD_HEADER'
  isActive: boolean
  clickCount: number
  impressionCount: number
  createdAt: string
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    position: 'HOMEPAGE_HERO' as 'HOMEPAGE_HERO' | 'DASHBOARD_HEADER',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data?.authenticated && data.user.role === 'ADMIN') {
            setUser(data.user)
            loadBanners()
          } else {
            window.location.href = '/auth/login'
          }
        } else {
          window.location.href = '/auth/login'
        }
      } catch (e) {
        console.error('Error loading user:', e)
        window.location.href = '/auth/login'
      }
    }
    loadUser()
  }, [])

  const loadBanners = async () => {
    try {
      const res = await fetch('/api/banners')
      if (res.ok) {
        const data = await res.json()
        setBanners(data.banners || [])
      }
    } catch (e) {
      console.error('Error loading banners:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (fileUrl: string, fileName: string) => {
    setFormData(prev => ({ ...prev, imageUrl: fileUrl }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.title || !formData.imageUrl || !formData.position) {
      setError('Please fill in all required fields')
      return
    }

    try {
      const url = editingBanner ? `/api/banners/${editingBanner.id}` : '/api/banners'
      const method = editingBanner ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setSuccess(editingBanner ? 'Banner updated successfully!' : 'Banner created successfully!')
        setFormData({ title: '', imageUrl: '', linkUrl: '', position: 'HOMEPAGE_HERO' })
        setShowForm(false)
        setEditingBanner(null)
        loadBanners()
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to save banner')
      }
    } catch (err) {
      setError('Failed to save banner')
    }
  }

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      position: banner.position,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Banner deleted successfully!')
        loadBanners()
      } else {
        setError('Failed to delete banner')
      }
    } catch (err) {
      setError('Failed to delete banner')
    }
  }

  const toggleActive = async (banner: Banner) => {
    try {
      const res = await fetch(`/api/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !banner.isActive }),
      })
      if (res.ok) {
        loadBanners()
      }
    } catch (err) {
      setError('Failed to update banner status')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading banners...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userName={user?.profile?.name} userRole={user?.role} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Banner Management</h1>
              <p className="text-gray-600 mt-1">Manage promotional banners across the platform</p>
            </div>
            <button
              onClick={() => {
                setShowForm(true)
                setEditingBanner(null)
                setFormData({ title: '', imageUrl: '', linkUrl: '', position: 'HOMEPAGE_HERO' })
              }}
              className="nh-btn nh-btn--primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Banner
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Banner Form */}
        {showForm && (
          <div className="nh-card mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingBanner ? 'Edit Banner' : 'Create New Banner'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="nh-input"
                    placeholder="Enter banner title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position *
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value as any }))}
                    className="nh-input"
                    required
                  >
                    <option value="HOMEPAGE_HERO">Homepage Hero (1200x300px)</option>
                    <option value="DASHBOARD_HEADER">Dashboard Header (1000x150px)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Image *
                </label>
                <FileUpload
                  onFileSelect={handleFileUpload}
                  accept="image/*"
                  maxSize={2 * 1024 * 1024} // 2MB
                />
                {formData.imageUrl && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ Image uploaded successfully
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                  className="nh-input"
                  placeholder="https://example.com"
                />
              </div>

              <div className="flex space-x-4">
                <button type="submit" className="nh-btn nh-btn--primary">
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingBanner(null)
                    setFormData({ title: '', imageUrl: '', linkUrl: '', position: 'HOMEPAGE_HERO' })
                  }}
                  className="nh-btn nh-btn--ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Banners List */}
        <div className="nh-card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Banners</h2>
          {banners.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No banners found. Create your first banner above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Banner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Analytics
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {banners.map((banner) => (
                    <tr key={banner.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="h-16 w-32 object-cover rounded-lg"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{banner.title}</div>
                            {banner.linkUrl && (
                              <a
                                href={banner.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View Link
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {banner.position === 'HOMEPAGE_HERO' ? 'Homepage Hero' : 'Dashboard Header'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleActive(banner)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            banner.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {banner.isActive ? (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>Clicks: {banner.clickCount}</div>
                          <div>Impressions: {banner.impressionCount}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(banner)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(banner.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
