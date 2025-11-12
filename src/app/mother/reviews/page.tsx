'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, User, Calendar, MessageCircle } from 'lucide-react'

export default function MotherReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showReviewForm, setShowReviewForm] = useState<string | null>(null)
  const [reviewForm, setReviewForm] = useState({
    appearance: 0,
    attitude: 0,
    knowledge: 0,
    hygiene: 0,
    salary: 0,
    comment: ''
  })

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

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load reviews
        const reviewsRes = await fetch('/api/reviews?type=given', { cache: 'no-store' })
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json()
          setReviews(reviewsData.reviews || [])
        }

        // Load requests
        const requestsRes = await fetch('/api/requests', { cache: 'no-store' })
        if (requestsRes.ok) {
          const requestsData = await requestsRes.json()
          setRequests(requestsData.requests || [])
        }
      } catch (e) {
        console.error('Error loading data:', e)
      }
    }
    loadData()
  }, [])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent'
    if (rating >= 4.0) return 'Very Good'
    if (rating >= 3.5) return 'Good'
    if (rating >= 3.0) return 'Fair'
    return 'Poor'
  }

  const handleStarClick = (category: string, rating: number) => {
    setReviewForm(prev => ({
      ...prev,
      [category]: rating
    }))
  }

  const handleSubmitReview = async (nurseId: string) => {
    if (reviewForm.appearance === 0 || reviewForm.attitude === 0 || reviewForm.knowledge === 0 || reviewForm.hygiene === 0 || reviewForm.salary === 0) {
      alert('Please rate all categories before submitting your review.')
      return
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: nurseId,
          ...reviewForm,
        }),
      })

      if (res.ok) {
        alert('Review submitted successfully!')
        setShowReviewForm(null)
        setReviewForm({
          appearance: 0,
          attitude: 0,
          knowledge: 0,
          hygiene: 0,
          salary: 0,
          comment: ''
        })
        // Reload reviews
        const reviewsRes = await fetch('/api/reviews?type=given', { cache: 'no-store' })
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json()
          setReviews(reviewsData.reviews || [])
        }
      } else {
        alert('Failed to submit review. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review. Please try again.')
    }
  }

  const getRequestsToReview = () => {
    return requests.filter(request => 
      request.status === 'COMPLETED' && 
      !reviews.some(review => review.receiverId === request.nurse.id)
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
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
                ENFAS
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
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <Link href="/mother/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="nh-h2">My Reviews</h1>
          <p className="nh-sub mt-1">Rate and review the nurses you've hired</p>
        </div>

        {/* Trust strip */}
        <div className="nh-card mb-6" style={{background:'linear-gradient(90deg,#F0F9FF,#ECFDF5)'}}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="nh-badge nh-badge--ok">Verified</span>
            <span className="nh-badge nh-badge--info">Private & Secure</span>
          </div>
        </div>

        {/* Requests to Review */}
        {getRequestsToReview().length > 0 && (
          <div className="mb-8">
            <h2 className="nh-h2" style={{fontSize:'18px',marginBottom:'10px'}}>Complete Your Reviews</h2>
            <div className="space-y-4">
              {getRequestsToReview().map((request) => (
                <div key={request.id} className="nh-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{request.nurse?.nurseProfile?.name || 'Nurse'}</h3>
                        <p className="text-gray-600">Request completed - Please rate your experience</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowReviewForm(showReviewForm === request.nurse.id ? null : request.nurse.id)}
                      className="nh-btn nh-btn--primary"
                    >
                      {showReviewForm === request.nurse.id ? 'Cancel' : 'Write Review'}
                    </button>
                  </div>

                  {/* Review Form */}
                  {showReviewForm === request.nurse.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200 pb-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Rate {request.nurse?.nurseProfile?.name || 'Nurse'}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                        {[
                          { key: 'appearance', label: 'Appearance' },
                          { key: 'attitude', label: 'Attitude' },
                          { key: 'knowledge', label: 'Knowledge' },
                          { key: 'hygiene', label: 'Hygiene' },
                          { key: 'salary', label: 'Salary Value' }
                        ].map(({ key, label }) => (
                          <div key={key} className="text-center">
                            <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
                            <div className="flex justify-center space-x-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`w-6 h-6 cursor-pointer ${
                                    i < (reviewForm[key as keyof typeof reviewForm] as number)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300 hover:text-yellow-400'
                                  }`}
                                  onClick={() => handleStarClick(key, i + 1)}
                                />
                              ))}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {reviewForm[key as keyof typeof reviewForm]}/5
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Comments (Optional)
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="Share your experience with this nurse..."
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                        />
                      </div>

                      <div className="flex justify-end space-x-3 mt-4">
                        <button
                          onClick={() => setShowReviewForm(null)}
                          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSubmitReview(request.nurse.id)}
                          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                        >
                          Submit Review
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length === 0 && getRequestsToReview().length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600 mb-6">Start by request and hiring a nurse</p>
              <Link href="/nurses" className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
                Find Nurses
              </Link>
            </div>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{review.receiver.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center">
                          {renderStars(review.averageRating)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {review.averageRating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({getRatingLabel(review.averageRating)})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Detailed Ratings */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Appearance</div>
                    <div className="flex justify-center">
                      {renderStars(review.appearance)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{review.appearance}/5</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Attitude</div>
                    <div className="flex justify-center">
                      {renderStars(review.attitude)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{review.attitude}/5</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Knowledge</div>
                    <div className="flex justify-center">
                      {renderStars(review.knowledge)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{review.knowledge}/5</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Hygiene</div>
                    <div className="flex justify-center">
                      {renderStars(review.hygiene)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{review.hygiene}/5</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Salary</div>
                    <div className="flex justify-center">
                      {renderStars(review.salary)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{review.salary}/5</div>
                  </div>
                </div>

                {/* Comment */}
                {review.comment && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Review submitted on {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-500 hover:text-gray-700 p-1">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : null}
        </div>
      </div>
    </div>
  )
}
