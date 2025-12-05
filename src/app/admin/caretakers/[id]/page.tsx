'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, Download, Image as ImageIcon, FileText, Award, User, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

interface CareTakerProfile {
  id: string
  name: string
  age: number
  email: string
  phone?: string
  location?: string
  totalExperience: number
  kuwaitExperience: number
  partTimeSalary: number
  fullTimeSalary: number
  aboutMe?: string
  profileImageUrl?: string
  certifications?: string[]
  languages: string[]
  availability: string[]
  status: string
  createdAt: string
}

export default function AdminCaretakerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [caretaker, setCaretaker] = useState<CareTakerProfile | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewer, setViewer] = useState<{ url: string; type: 'image' | 'pdf' } | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!res.ok || !res.json) {
          router.push('/auth/login')
          return
        }
        const data = await res.json()
        if (data?.authenticated && data.user?.role === 'ADMIN') {
          setUser(data.user)
          loadCaretaker()
        } else {
          router.push('/auth/login')
        }
      } catch (e) {
        console.error(e)
        router.push('/auth/login')
      }
    }
    loadUser()
  }, [params.id])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (viewer) {
      document.body.style.overflow = 'hidden'
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [viewer])

  const loadCaretaker = async () => {
    try {
      const res = await fetch(`/api/caretakers/${params.id}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.caretaker) {
          // Also fetch full profile data including email
          const adminRes = await fetch(`/api/admin/caretakers`, { cache: 'no-store' })
          if (adminRes.ok) {
            const adminData = await adminRes.json()
            const fullCaretaker = adminData.caretakers?.find((c: any) => c.id === params.id)
            if (fullCaretaker) {
              setCaretaker({
                ...data.caretaker,
                email: fullCaretaker.email,
                phone: fullCaretaker.phone,
                location: fullCaretaker.location,
                createdAt: fullCaretaker.createdAt || fullCaretaker.submittedAt,
              })
            } else {
              setCaretaker(data.caretaker)
            }
          } else {
            setCaretaker(data.caretaker)
          }
        }
      }
    } catch (e) {
      console.error('Error loading care taker:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = (url: string) => {
    const normalizedUrl = url.split('?')[0] || url
    if (/\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(normalizedUrl)) {
      setViewer({ url, type: 'image' })
      return
    }
    if (/\.pdf$/i.test(normalizedUrl)) {
      setViewer({ url, type: 'pdf' })
      return
    }

    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleDownload = (url: string, filename: string) => {
    // Create a temporary link to download the file
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getFileName = (url: string) => {
    const parts = url.split('/')
    return parts[parts.length - 1] || 'file'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading care taker details...</p>
        </div>
      </div>
    )
  }

  if (!caretaker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Care taker not found</p>
          <Link href="/admin/caretakers" className="text-primary-600 hover:text-primary-900 mt-4 inline-block">
            ← Back to Care Takers
          </Link>
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
          <Link href="/admin/caretakers" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Care Takers
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{caretaker.name}</h1>
              <p className="text-gray-600 mt-1">Care Taker Profile Details</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              caretaker.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
              caretaker.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {caretaker.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Picture Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2 text-primary-600" />
                Profile Picture
              </h2>
              {caretaker.profileImageUrl ? (
                <div className="flex items-center space-x-4">
                  <div 
                    className="relative flex-shrink-0 w-20 h-20 overflow-hidden"
                    style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #e5e7eb' }}
                  >
                    <img
                      src={caretaker.profileImageUrl}
                      alt={caretaker.name}
                      className="w-full h-full object-cover"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => {
                        // Hide broken image and show placeholder
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent && !parent.querySelector('.placeholder')) {
                          const placeholder = document.createElement('div')
                          placeholder.className = 'placeholder w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center'
                          placeholder.innerHTML = '<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>'
                          parent.appendChild(placeholder)
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 mb-2">Profile Image</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleView(caretaker.profileImageUrl!)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(caretaker.profileImageUrl!, `profile-${caretaker.name}-${getFileName(caretaker.profileImageUrl!)}`)}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0" style={{ width: '80px', height: '80px' }}>
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No profile picture uploaded</p>
                </div>
              )}
            </div>

            {/* Certifications Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-primary-600" />
                Certifications & Credentials
                {caretaker.certifications && caretaker.certifications.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">({caretaker.certifications.length})</span>
                )}
              </h2>
              {caretaker.certifications && caretaker.certifications.length > 0 ? (
                <div className="space-y-3">
                  {caretaker.certifications.map((certUrl, index) => {
                    const fileName = getFileName(certUrl)
                    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(fileName)
                    const isPDF = /\.pdf$/i.test(fileName)
                    
                    return (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {isImage ? (
                              <img
                                src={certUrl}
                                alt={fileName}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            ) : isPDF ? (
                              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-8 h-8 text-red-600" />
                              </div>
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-8 h-8 text-gray-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {fileName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {isImage ? 'Image' : isPDF ? 'PDF Document' : 'Document'}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleView(certUrl)}
                              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </button>
                            <button
                              onClick={() => handleDownload(certUrl, fileName)}
                              className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500">No certifications uploaded</p>
              )}
            </div>

            {/* About Section */}
            {caretaker.aboutMe && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About {caretaker.name}</h2>
                <p className="text-gray-600 leading-relaxed">{caretaker.aboutMe}</p>
              </div>
            )}

            {/* Experience & Skills */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Experience & Skills</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Experience</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Experience</span>
                      <span className="font-medium">{caretaker.totalExperience} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kuwait Experience</span>
                      <span className="font-medium">{caretaker.kuwaitExperience} years</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {caretaker.languages && caretaker.languages.length > 0 ? (
                      caretaker.languages.map((language) => (
                        <span
                          key={language}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {language}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No languages specified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact & Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{caretaker.email}</p>
                  </div>
                </div>
                {caretaker.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{caretaker.phone}</p>
                    </div>
                  </div>
                )}
                {caretaker.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-medium text-gray-900">{caretaker.location}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(caretaker.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Part-time Rate</span>
                  <span className="font-medium">KD {caretaker.partTimeSalary}/hour</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Full-time Rate</span>
                  <span className="font-medium">KD {caretaker.fullTimeSalary}/hour</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Viewer Modal */}
      {viewer && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setViewer(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center rounded-3xl shadow-2xl overflow-hidden bg-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            {viewer.type === 'image' ? (
              <img
                src={viewer.url}
                alt="Preview"
                className="max-w-full max-h-[85vh] object-contain"
              />
            ) : (
              <iframe
                src={`${viewer.url}#toolbar=0&navpanes=0`}
                className="w-full h-[80vh] bg-white"
                title="Document preview"
              />
            )}
            <button
              onClick={() => setViewer(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-lg"
              aria-label="Close preview"
            >
              <span className="text-2xl font-bold text-gray-800 leading-none">×</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

