'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, MapPin, Clock, Heart, User, MessageCircle, Calendar, Shield, Award, CheckCircle, X } from 'lucide-react'

interface CareTaker {
  id: string
  name: string
  age: number
  totalExperience: number
  kuwaitExperience: number
  gccExperience?: number
  partTimeSalary: number
  fullTimeSalary: number
  expectedSalary?: number | null
  maritalStatus?: string | null
  aboutMe: string
  profileImageUrl?: string
  averageRating: number
  reviewCount: number
  languages: string[]
  skills?: string[]
  availability: string[]
  certifications?: string[]
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

export default function CareTakerProfilePage() {
  const params = useParams()
  const [caretaker, setCaretaker] = useState<CareTaker | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')
  const [requestPhone, setRequestPhone] = useState('')
  const [preferredContactTime, setPreferredContactTime] = useState('')
  const [urgency, setUrgency] = useState('MEDIUM')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [viewer, setViewer] = useState<{ url: string; type: 'image' | 'pdf' } | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [existingReview, setExistingReview] = useState<any>(null)
  const [reviewForm, setReviewForm] = useState({
    appearance: 0,
    attitude: 0,
    knowledge: 0,
    hygiene: 0,
    salary: 0,
    comment: ''
  })
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    const loadCaretakerProfile = async () => {
      try {
        const res = await fetch(`/api/caretakers/${params.id}`, { cache: 'no-store' })
        if (!res.ok) {
          setIsLoading(false)
          return
        }
        const data = await res.json()
        if (data.caretaker) {
          setCaretaker(data.caretaker)
          setReviews(data.reviews || [])
        }
      } catch (e) {
        console.error('Error loading care taker profile:', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadCaretakerProfile()
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

  useEffect(() => {
    const checkIfReviewed = async () => {
      if (!isAuthenticated || !user || user.role !== 'USER' || !caretaker) return
      
      try {
        const res = await fetch('/api/reviews?type=given', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const foundReview = data.reviews?.find((r: any) => r.receiver.id === caretaker.id)
          if (foundReview) {
            setHasReviewed(true)
            setExistingReview(foundReview)
          } else {
            setHasReviewed(false)
            setExistingReview(null)
          }
        }
      } catch (e) {
        console.error('Error checking review status:', e)
      }
    }
    checkIfReviewed()
  }, [isAuthenticated, user, caretaker])

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

  const handleInformationRequest = async () => {
    if (!caretaker) return
    
    console.log('Information request - isAuthenticated:', isAuthenticated, 'user role:', user?.role)
    console.log('Care taker ID:', caretaker.id)
    
    // Check authentication before proceeding
    if (!isAuthenticated || user?.role !== 'USER') {
      alert('You must be logged in as a user to request information. Please sign in.')
      setShowRequestModal(false)
      return
    }
    
    if (!requestMessage.trim()) {
      alert('Please provide a message explaining what information you need.')
      return
    }
    
    setIsSubmitting(true)
    try {
      console.log('Sending information request...')
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caretakerId: caretaker.id,
          message: requestMessage,
          phone: requestPhone || null,
          preferredContactTime: preferredContactTime || null,
          urgency: urgency,
        }),
      })

      console.log('Request response status:', res.status)
      const responseData = await res.json()
      console.log('Request response data:', responseData)

      if (res.ok) {
        alert('Information request sent successfully! Our admin will contact you soon with the details you need.')
        setShowRequestModal(false)
        setRequestMessage('')
        setRequestPhone('')
        setPreferredContactTime('')
        setUrgency('MEDIUM')
      } else {
        if (res.status === 401) {
          alert('Please sign in to request information.')
        } else if (res.status === 403) {
          alert('Only users can request information. Please sign in with a user account.')
        } else {
          alert(responseData.error || 'Failed to send information request. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error sending information request:', error)
      alert('Failed to send information request. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendMessage = async () => {
    if (!caretaker) return
    
    // Check authentication before proceeding
    if (!isAuthenticated || user?.role !== 'USER') {
      alert('You must be logged in as a mother to message a care taker. Please sign in.')
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
          receiverId: caretaker.id,
          content: `Hello ${caretaker.name}, I'm interested in your care taking services.`,
        }),
      })

      if (res.ok) {
        // Redirect to messages page
        window.location.href = '/mother/messages'
      } else {
        const error = await res.json()
        if (res.status === 401) {
          alert('Please sign in to message a care taker.')
        } else if (res.status === 403) {
          alert('Only mothers can message care takers. Please sign in with a mother account.')
        } else {
          alert(error.error || 'Failed to send message. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please check your connection and try again.')
    }
  }

  const handleViewFile = (url: string) => {
    const cleanUrl = url.split('?')[0] || url
    if (/\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(cleanUrl)) {
      setViewer({ url, type: 'image' })
      return
    }
    if (/\.pdf$/i.test(cleanUrl)) {
      setViewer({ url, type: 'pdf' })
      return
    }

    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleStarClick = (category: string, rating: number) => {
    setReviewForm(prev => ({
      ...prev,
      [category]: rating
    }))
  }

  const handleSubmitReview = async () => {
    if (!caretaker) return
    
    if (reviewForm.appearance === 0 || reviewForm.attitude === 0 || reviewForm.knowledge === 0 || reviewForm.hygiene === 0 || reviewForm.salary === 0) {
      // Validation is handled by the disabled button and warning message
      return
    }

    if (!isAuthenticated || user?.role !== 'USER') {
      alert('Please log in as a user to submit a review.')
      window.location.href = '/auth/login'
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: caretaker.id,
          ...reviewForm,
        }),
      })

      if (res.ok) {
        setShowSuccess(true)
        setShowReviewModal(false)
        setReviewForm({
          appearance: 0,
          attitude: 0,
          knowledge: 0,
          hygiene: 0,
          salary: 0,
          comment: ''
        })
        setHasReviewed(true)
        // Reload care taker profile to update review count
        const caretakerRes = await fetch(`/api/caretakers/${params.id}`, { cache: 'no-store' })
        if (caretakerRes.ok) {
          const caretakerData = await caretakerRes.json()
          if (caretakerData.caretaker) {
            setCaretaker(caretakerData.caretaker)
            setReviews(caretakerData.reviews || [])
          }
        }
        // Reload review status
        const reviewRes = await fetch('/api/reviews?type=given', { cache: 'no-store' })
        if (reviewRes.ok) {
          const reviewData = await reviewRes.json()
          const foundReview = reviewData.reviews?.find((r: any) => r.receiver.id === caretaker.id)
          if (foundReview) {
            setExistingReview(foundReview)
          }
        }
        // Hide success message after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to submit review. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading care taker profile...</p>
        </div>
      </div>
    )
  }

  if (!caretaker) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Care taker not found</h2>
          <p className="text-neutral-600 mb-6">The care taker you're looking for doesn't exist.</p>
          <Link href="/caretakers" className="btn-primary">
            Browse All Care Takers
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
            <Link href="/caretakers" className="flex items-center text-neutral-600 hover:text-neutral-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Care Takers
            </Link>
            <div className="flex items-center space-x-4">
              {isAuthenticated && user?.role === 'USER' && (
                <>
                  {!hasReviewed ? (
                    <button 
                      onClick={() => setShowReviewModal(true)}
                      className="btn-primary"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Review this Care Taker
                    </button>
                  ) : (
                    <Link 
                      href="/user/reviews"
                      className="btn-secondary"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Reviews
                    </Link>
                  )}
                </>
              )}
              <button className="btn-secondary">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </button>
              <button 
                onClick={() => setShowRequestModal(true)}
                className="btn-primary"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Request Information
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-[100] bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 max-w-md animate-slide-in">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900 mb-1">Review Submitted!</h4>
              <p className="text-sm text-green-700">
                Your review is pending admin approval and will be visible once approved.
              </p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="ml-3 text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Header */}
            <div className="card">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {caretaker.profileImageUrl ? (
                    <button
                      type="button"
                      onClick={() => handleViewFile(caretaker.profileImageUrl!)}
                      className="w-full h-full focus:outline-none"
                      aria-label="View profile picture"
                    >
                      <img
                        src={caretaker.profileImageUrl}
                        alt={caretaker.name}
                        className="w-24 h-24 rounded-full object-cover transition-transform duration-150 hover:scale-105"
                      />
                    </button>
                  ) : (
                    <User className="w-12 h-12 text-primary-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">{caretaker.name}</h1>
                  <p className="text-lg text-neutral-600 mb-4">
                    {caretaker.age} years old • {caretaker.totalExperience} years experience
                  </p>
                  <div className="flex items-center space-x-1 mb-4">
                    {renderStars(caretaker.averageRating)}
                    <span className="text-lg font-semibold text-neutral-900 ml-2">
                      {caretaker.averageRating}
                    </span>
                    <span className="text-neutral-600 ml-2">
                      ({caretaker.reviewCount} reviews)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {caretaker.availability.map((avail) => (
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
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">About {caretaker.name}</h2>
              <p className="text-neutral-600 leading-relaxed">{caretaker.aboutMe}</p>
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
                      <span className="font-medium">{caretaker.totalExperience} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Kuwait Experience</span>
                      <span className="font-medium">{caretaker.kuwaitExperience} years</span>
                    </div>
                    {caretaker.gccExperience !== undefined && caretaker.gccExperience > 0 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">GCC Experience</span>
                        <span className="font-medium">{caretaker.gccExperience} years</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-3">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {caretaker.languages && caretaker.languages.length > 0 ? (
                      caretaker.languages.map((language) => (
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

            {/* Skills Section */}
            {caretaker.skills && caretaker.skills.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {caretaker.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications Section */}
            {caretaker.certifications && caretaker.certifications.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-primary-600" />
                  Certifications & Credentials
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {caretaker.certifications.map((certUrl, index) => {
                    const fileName = certUrl.split('/').pop() || `Certificate ${index + 1}`
                    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(fileName)
                    const isPDF = /\.pdf$/i.test(fileName)
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleViewFile(certUrl)}
                        className="border border-neutral-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-lg transition-all group text-left min-h-[100px] flex items-center"
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center overflow-hidden">
                            {isImage ? (
                              <img
                                src={certUrl}
                                alt={fileName}
                                className="w-16 h-16 object-cover"
                              />
                            ) : isPDF ? (
                              <span className="text-2xl">📄</span>
                            ) : (
                              <span className="text-2xl">📎</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate group-hover:text-primary-600">
                              {fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                              Click to view
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="card">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Reviews ({caretaker.reviewCount})</h2>
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
                    {caretaker.partTimeSalary} KD/hour
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Full-time Rate</span>
                  <span className="text-xl font-bold text-primary-600">
                    {caretaker.fullTimeSalary} KD/hour
                  </span>
                </div>
                {caretaker.expectedSalary && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Expected Salary</span>
                    <span className="text-xl font-bold text-primary-600">
                      {caretaker.expectedSalary} KD/hour
                    </span>
                  </div>
                )}
              </div>

              {/* Personal Information */}
              {(caretaker.maritalStatus || caretaker.age) && (
                <div className="space-y-4 mb-6 pt-6 border-t border-neutral-200">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Personal Information</h3>
                  {caretaker.age && (
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Age</span>
                      <span className="font-medium text-neutral-900">{caretaker.age} years</span>
                    </div>
                  )}
                  {caretaker.maritalStatus && (
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Marital Status</span>
                      <span className="font-medium text-neutral-900">{caretaker.maritalStatus}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="flex items-center text-sm text-neutral-600">
                  <Shield className="w-4 h-4 mr-2 text-green-500" />
                  Verified
                </div>
                <div className="flex items-center text-sm text-neutral-600">
                  <Award className="w-4 h-4 mr-2 text-blue-500" />
                  Background Checked
                </div>
                <div className="flex items-center text-sm text-neutral-600">
                  <Heart className="w-4 h-4 mr-2 text-red-500" />
                  {caretaker.reviewCount} Reviews
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
              ) : user?.role !== 'USER' ? (
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
                      console.log('Request button clicked, isAuthenticated:', isAuthenticated, 'user role:', user?.role)
                      setShowRequestModal(true)
                    }}
                    className="w-full btn-primary mb-4"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Request Information
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

      {/* Information Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Request Information About {caretaker.name}</h3>
            {!isAuthenticated || user?.role !== 'USER' ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">You must be logged in as a user to request information.</p>
                <Link 
                  href="/auth/login"
                  className="btn-primary"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <>
                <p className="text-neutral-600 mb-6">
                  Tell us what information you need about {caretaker.name}. Our admin will contact you with the details.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="label">What information do you need? *</label>
                    <textarea
                      className="input-field h-24 resize-none"
                      placeholder="e.g., I need to know about her availability for night shifts, her experience with newborns, her rates..."
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="label">Your Phone Number (Optional)</label>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="+965 XXXX XXXX"
                      value={requestPhone}
                      onChange={(e) => setRequestPhone(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="label">Preferred Contact Time (Optional)</label>
                    <select
                      className="input-field"
                      value={preferredContactTime}
                      onChange={(e) => setPreferredContactTime(e.target.value)}
                    >
                      <option value="">Select time</option>
                      <option value="Morning (8AM-12PM)">Morning (8AM-12PM)</option>
                      <option value="Afternoon (12PM-5PM)">Afternoon (12PM-5PM)</option>
                      <option value="Evening (5PM-9PM)">Evening (5PM-9PM)</option>
                      <option value="Any time">Any time</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="label">Urgency Level</label>
                    <select
                      className="input-field"
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                    >
                      <option value="LOW">Low - No rush</option>
                      <option value="MEDIUM">Medium - Within a few days</option>
                      <option value="HIGH">High - Urgent, need soon</option>
                    </select>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowRequestModal(false)}
                      className="flex-1 btn-secondary"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInformationRequest}
                      className="flex-1 btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Request'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 z-50" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => {
            if (!isSubmitting) {
              setShowReviewModal(false)
              setReviewForm({
                appearance: 0,
                attitude: 0,
                knowledge: 0,
                hygiene: 0,
                salary: 0,
                comment: ''
              })
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with care taker info */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-neutral-200">
              <div className="flex items-center space-x-4">
                {caretaker?.profileImageUrl ? (
                  <img
                    src={caretaker.profileImageUrl}
                    alt={caretaker?.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-semibold text-neutral-900">Review {caretaker?.name}</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    Share your experience • Pending admin approval
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowReviewModal(false)
                  setReviewForm({
                    appearance: 0,
                    attitude: 0,
                    knowledge: 0,
                    hygiene: 0,
                    salary: 0,
                    comment: ''
                  })
                }}
                className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Rating Categories */}
              <div className="bg-neutral-50 rounded-xl p-4 mb-4">
                <p className="text-sm font-medium text-neutral-700 mb-4">Rate the following categories (required):</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'appearance', label: 'Appearance', icon: '✨' },
                    { key: 'attitude', label: 'Attitude', icon: '😊' },
                    { key: 'knowledge', label: 'Knowledge', icon: '📚' },
                    { key: 'hygiene', label: 'Hygiene', icon: '🧼' },
                    { key: 'salary', label: 'Salary Value', icon: '💰' }
                  ].map(({ key, label, icon }) => {
                    const rating = reviewForm[key as keyof typeof reviewForm] as number
                    const isComplete = rating > 0
                    return (
                      <div key={key} className={`space-y-2 p-3 rounded-lg transition-colors ${isComplete ? 'bg-white border border-green-200' : 'bg-transparent'}`}>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-neutral-700 flex items-center">
                            <span className="mr-2">{icon}</span>
                            {label}
                          </label>
                          {isComplete && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 cursor-pointer transition-all ${
                                i < rating
                                  ? 'text-yellow-400 fill-current scale-110'
                                  : 'text-neutral-300 hover:text-yellow-300 hover:scale-105'
                              }`}
                              onClick={() => handleStarClick(key, i + 1)}
                            />
                          ))}
                          <span className={`text-sm font-medium ml-2 ${isComplete ? 'text-green-600' : 'text-neutral-500'}`}>
                            {rating > 0 ? `${rating}/5` : 'Not rated'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Comment */}
              <div className="bg-neutral-50 rounded-xl p-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white"
                  rows={4}
                  placeholder="Share your experience with this caretaker... (e.g., punctuality, communication, professionalism, etc.)"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                />
                <p className="text-xs text-neutral-500 mt-2">
                  {reviewForm.comment.length} characters
                </p>
              </div>

              {/* Validation Message */}
              {(reviewForm.appearance === 0 || reviewForm.attitude === 0 || reviewForm.knowledge === 0 || reviewForm.hygiene === 0 || reviewForm.salary === 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start">
                  <div className="text-yellow-600 mr-2 mt-0.5">⚠️</div>
                  <p className="text-sm text-yellow-800">
                    Please rate all categories before submitting your review.
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => {
                    setShowReviewModal(false)
                    setReviewForm({
                      appearance: 0,
                      attitude: 0,
                      knowledge: 0,
                      hygiene: 0,
                      salary: 0,
                      comment: ''
                    })
                  }}
                  className="px-6 py-2.5 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm hover:shadow-md"
                  disabled={isSubmitting || reviewForm.appearance === 0 || reviewForm.attitude === 0 || reviewForm.knowledge === 0 || reviewForm.hygiene === 0 || reviewForm.salary === 0}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    {viewer && (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={() => setViewer(null)}
      >
        <div
          className={`relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden ${
            viewer.type === 'pdf' ? 'max-w-5xl max-h-[90vh]' : 'max-w-4xl'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setViewer(null)}
            className="absolute top-3 right-3 bg-neutral-100 hover:bg-neutral-200 transition-colors rounded-full p-2 shadow z-10"
            aria-label="Close preview"
          >
            <span className="text-lg font-bold text-neutral-800 leading-none">×</span>
          </button>
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-900 text-center">File Preview</h3>
              <p className="text-xs text-neutral-500 text-center">
                Viewing only — downloads are disabled.
              </p>
            </div>
            {viewer.type === 'image' ? (
              <div className="flex flex-col items-center gap-3 max-h-[75vh] overflow-y-auto">
                <img
                  src={viewer.url}
                  alt="Preview"
                  className="w-full max-w-3xl rounded-xl object-contain border-4 border-white shadow-lg bg-neutral-50"
                  style={{ maxHeight: '70vh' }}
                />
                <p className="text-xs text-neutral-500 text-center">
                  Tap anywhere outside the preview to close.
                </p>
              </div>
            ) : (
              <div className="w-full" style={{ height: '75vh' }}>
                <iframe
                  src={`${viewer.url}#toolbar=0&navpanes=0`}
                  className="w-full h-full bg-white rounded-xl border border-neutral-200"
                  title="Document preview"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </div>
  )
}
