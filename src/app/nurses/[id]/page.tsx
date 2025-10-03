'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, MapPin, Clock, Heart, User, MessageCircle, Calendar, Shield, Award } from 'lucide-react'

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

interface Review {
  id: string
  giverName: string
  appearance: number
  attitude: number
  knowledge: number
  hygiene: number
  salary: number
  comment: string
  createdAt: string
}

export default function NurseProfilePage() {
  const params = useParams()
  const [nurse, setNurse] = useState<Nurse | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingMessage, setBookingMessage] = useState('')
  const [isBooking, setIsBooking] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const loadNurseProfile = async () => {
      try {
        const res = await fetch(`/api/nurses/${params.id}`, { cache: 'no-store' })
        if (!res.ok) {
          setIsLoading(false)
          return
        }
        const data = await res.json()
        if (data.nurse) {
          setNurse(data.nurse)
          setReviews(data.reviews || [])
        }
      } catch (e) {
        console.error('Error loading nurse profile:', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadNurseProfile()
  }, [params.id])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...')
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        console.log('Auth response status:', res.status)
        if (res.ok) {
          const data = await res.json()
          console.log('Auth data:', data) // Debug log
          if (data?.authenticated) {
            setUser(data.user)
            setIsAuthenticated(true)
            console.log('User authenticated:', data.user) // Debug log
            console.log('User role:', data.user?.role)
          } else {
            console.log('User not authenticated')
            setIsAuthenticated(false)
          }
        } else {
          console.log('Auth request failed with status:', res.status)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        setIsAuthenticated(false)
      }
    }
    checkAuth()
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

  const getAverageRating = (review: Review) => {
    return (review.appearance + review.attitude + review.knowledge + review.hygiene + review.salary) / 5
  }

  const handleBookingRequest = async () => {
    if (!nurse) return
    
    // Check authentication before proceeding
    if (!isAuthenticated || user?.role !== 'MOTHER') {
      alert('You must be logged in as a mother to book a nurse. Please sign in.')
      setShowBookingModal(false)
      return
    }
    
    setIsBooking(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nurseId: nurse.id,
          message: bookingMessage,
        }),
      })

      if (res.ok) {
        alert('Booking request sent successfully! You can view your bookings in your dashboard.')
        setShowBookingModal(false)
        setBookingMessage('')
      } else {
        const error = await res.json()
        if (res.status === 401) {
          alert('Please sign in to book a nurse.')
        } else if (res.status === 403) {
          alert('Only mothers can book nurses. Please sign in with a mother account.')
        } else {
          alert(error.error || 'Failed to send booking request. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error sending booking request:', error)
      alert('Failed to send booking request. Please check your connection and try again.')
    } finally {
      setIsBooking(false)
    }
  }

  const handleSendMessage = async () => {
    if (!nurse) return
    
    // Check authentication before proceeding
    if (!isAuthenticated || user?.role !== 'MOTHER') {
      alert('You must be logged in as a mother to message a nurse. Please sign in.')
      return
    }
    
    try {
      // Create a message to start the conversation
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: nurse.id,
          content: `Hello ${nurse.name}, I'm interested in your nursing services.`,
        }),
      })

      if (res.ok) {
        // Redirect to messages page
        window.location.href = '/mother/messages'
      } else {
        const error = await res.json()
        if (res.status === 401) {
          alert('Please sign in to message a nurse.')
        } else if (res.status === 403) {
          alert('Only mothers can message nurses. Please sign in with a mother account.')
        } else {
          alert(error.error || 'Failed to send message. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please check your connection and try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading nurse profile...</p>
        </div>
      </div>
    )
  }

  if (!nurse) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Nurse not found</h2>
          <p className="text-neutral-600 mb-6">The nurse you're looking for doesn't exist.</p>
          <Link href="/nurses" className="btn-primary">
            Browse All Nurses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow-soft">
        <div className="container-custom py-6">
          <div className="flex items-center justify-between">
            <Link href="/nurses" className="flex items-center text-neutral-600 hover:text-neutral-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Nurses
            </Link>
            <div className="flex items-center space-x-4">
              <button className="btn-secondary">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </button>
              <button 
                onClick={() => setShowBookingModal(true)}
                className="btn-primary"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Now
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
                    {nurse.languages.map((language) => (
                      <span
                        key={language}
                        className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="card">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Reviews ({nurse.reviewCount})</h2>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-neutral-100 pb-6 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-neutral-900">{review.giverName}</h4>
                        <div className="flex items-center space-x-1 mt-1">
                          {renderStars(getAverageRating(review))}
                          <span className="text-sm text-neutral-600 ml-2">
                            {getAverageRating(review).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm text-neutral-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-neutral-600 mb-3">{review.comment}</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-neutral-500">Appearance</span>
                        <div className="flex items-center space-x-1 mt-1">
                          {renderStars(review.appearance)}
                        </div>
                      </div>
                      <div>
                        <span className="text-neutral-500">Attitude</span>
                        <div className="flex items-center space-x-1 mt-1">
                          {renderStars(review.attitude)}
                        </div>
                      </div>
                      <div>
                        <span className="text-neutral-500">Knowledge</span>
                        <div className="flex items-center space-x-1 mt-1">
                          {renderStars(review.knowledge)}
                        </div>
                      </div>
                      <div>
                        <span className="text-neutral-500">Hygiene</span>
                        <div className="flex items-center space-x-1 mt-1">
                          {renderStars(review.hygiene)}
                        </div>
                      </div>
                      <div>
                        <span className="text-neutral-500">Salary</span>
                        <div className="flex items-center space-x-1 mt-1">
                          {renderStars(review.salary)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
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
                  <Shield className="w-4 h-4 mr-2 text-green-500" />
                  MOH License Verified
                </div>
                <div className="flex items-center text-sm text-neutral-600">
                  <Award className="w-4 h-4 mr-2 text-blue-500" />
                  Background Checked
                </div>
                <div className="flex items-center text-sm text-neutral-600">
                  <Heart className="w-4 h-4 mr-2 text-red-500" />
                  {nurse.reviewCount} Reviews
                </div>
              </div>

              {!isAuthenticated ? (
                <div className="space-y-3">
                  <Link 
                    href="/auth/login"
                    className="w-full btn-primary mb-4 block text-center"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Sign In to Book
                  </Link>
                  <Link 
                    href="/auth/login"
                    className="w-full btn-secondary block text-center"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Sign In to Message
                  </Link>
                </div>
              ) : user?.role !== 'MOTHER' ? (
                <div className="space-y-3">
                  <button 
                    disabled
                    className="w-full btn-primary mb-4 opacity-50 cursor-not-allowed"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Only Mothers Can Book
                  </button>
                  <button 
                    disabled
                    className="w-full btn-secondary opacity-50 cursor-not-allowed"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Only Mothers Can Message
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      console.log('Booking button clicked, isAuthenticated:', isAuthenticated, 'user role:', user?.role)
                      setShowBookingModal(true)
                    }}
                    className="w-full btn-primary mb-4"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book This Nurse
                  </button>
                  
                  <button 
                    onClick={() => handleSendMessage()}
                    className="w-full btn-secondary"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Book {nurse.name}</h3>
            {!isAuthenticated || user?.role !== 'MOTHER' ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">You must be logged in as a mother to book a nurse.</p>
                <p className="text-sm text-gray-500 mb-4">Debug: isAuthenticated={isAuthenticated.toString()}, role={user?.role || 'none'}</p>
                <p className="text-xs text-gray-400 mb-4">User object: {JSON.stringify(user, null, 2)}</p>
                <Link 
                  href="/auth/login"
                  className="btn-primary"
                >
                  Sign In as Mother
                </Link>
              </div>
            ) : (
              <>
                <p className="text-neutral-600 mb-6">
                  Send a booking request to {nurse.name}. They will review your request and get back to you.
                </p>
            <div className="space-y-4">
              <div>
                <label className="label">Message (Optional)</label>
                <textarea
                  className="input-field h-24 resize-none"
                  placeholder="Tell the nurse about your needs..."
                  value={bookingMessage}
                  onChange={(e) => setBookingMessage(e.target.value)}
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 btn-secondary"
                  disabled={isBooking}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookingRequest}
                  className="flex-1 btn-primary"
                  disabled={isBooking}
                >
                  {isBooking ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
