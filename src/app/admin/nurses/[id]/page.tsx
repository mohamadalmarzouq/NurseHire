'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, Download, Image as ImageIcon, FileText, Award, User, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

interface NurseProfile {
  id: string
  name: string
  age: number
  email: string
  phone?: string
  location?: string
  totalExperience: number
  kuwaitExperience: number
  partTimeSalary: number
  nightShiftSalary: number
  aboutMe?: string
  profileImageUrl?: string
  certifications?: string[]
  languages: string[]
  availability: string[]
  status: string
  createdAt: string
}

export default function AdminNurseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [nurse, setNurse] = useState<NurseProfile | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [viewingCert, setViewingCert] = useState<string | null>(null)

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
          loadNurse()
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

  const loadNurse = async () => {
    try {
      const res = await fetch(`/api/nurses/${params.id}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.nurse) {
          // Also fetch full profile data including email
          const adminRes = await fetch(`/api/admin/nurses`, { cache: 'no-store' })
          if (adminRes.ok) {
            const adminData = await adminRes.json()
            const fullNurse = adminData.nurses?.find((n: any) => n.id === params.id)
            if (fullNurse) {
              setNurse({
                ...data.nurse,
                email: fullNurse.email,
                phone: fullNurse.phone,
                location: fullNurse.location,
                createdAt: fullNurse.createdAt || fullNurse.submittedAt,
              })
            } else {
              setNurse(data.nurse)
            }
          } else {
            setNurse(data.nurse)
          }
        }
      }
    } catch (e) {
      console.error('Error loading nurse:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = (url: string, type: 'image' | 'cert') => {
    if (type === 'image') {
      setViewingImage(url)
    } else {
      // Open certificate in new tab for viewing (not downloading)
      // Use a data URL approach or ensure the link opens for viewing
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      // Don't set download attribute - this allows viewing in browser
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
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
          <p className="mt-4 text-gray-600">Loading nurse details...</p>
        </div>
      </div>
    )
  }

  if (!nurse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Nurse not found</p>
          <Link href="/admin/nurses" className="text-primary-600 hover:text-primary-900 mt-4 inline-block">
            ← Back to Nurses
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
          <Link href="/admin/nurses" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Nurses
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{nurse.name}</h1>
              <p className="text-gray-600 mt-1">Nurse Profile Details</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              nurse.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
              nurse.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {nurse.status}
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
              {nurse.profileImageUrl ? (
                <div className="flex items-center space-x-4">
                  <div className="relative flex-shrink-0 w-20 h-20">
                    <img
                      src={nurse.profileImageUrl}
                      alt={nurse.name}
                      className="w-20 h-20 object-cover rounded-full border-2 border-gray-200"
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%' }}
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
                        onClick={() => handleView(nurse.profileImageUrl!, 'image')}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(nurse.profileImageUrl!, `profile-${nurse.name}-${getFileName(nurse.profileImageUrl!)}`)}
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
                {nurse.certifications && nurse.certifications.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">({nurse.certifications.length})</span>
                )}
              </h2>
              {nurse.certifications && nurse.certifications.length > 0 ? (
                <div className="space-y-3">
                  {nurse.certifications.map((certUrl, index) => {
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
                              onClick={() => handleView(certUrl, 'cert')}
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
            {nurse.aboutMe && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About {nurse.name}</h2>
                <p className="text-gray-600 leading-relaxed">{nurse.aboutMe}</p>
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
                      <span className="font-medium">{nurse.totalExperience} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kuwait Experience</span>
                      <span className="font-medium">{nurse.kuwaitExperience} years</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {nurse.languages && nurse.languages.length > 0 ? (
                      nurse.languages.map((language) => (
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
                    <p className="text-sm font-medium text-gray-900">{nurse.email}</p>
                  </div>
                </div>
                {nurse.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{nurse.phone}</p>
                    </div>
                  </div>
                )}
                {nurse.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-medium text-gray-900">{nurse.location}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(nurse.createdAt).toLocaleDateString()}
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
                  <span className="font-medium">KD {nurse.partTimeSalary}/hour</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Night Shift Rate</span>
                  <span className="font-medium">KD {nurse.nightShiftSalary}/hour</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image View Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setViewingImage(null)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[95vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={viewingImage}
              alt="Profile"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              style={{ maxHeight: '90vh' }}
            />
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-2 right-2 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-lg z-10"
              style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span className="text-2xl font-bold text-gray-800 leading-none">×</span>
            </button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
              Click outside to close
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

