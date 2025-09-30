'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, User, Calendar, MessageCircle } from 'lucide-react'

export default function MotherReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock data - in real app, fetch from API
    setReviews([
      {
        id: 1,
        nurseName: 'Aisha Al-Rashid',
        nurseImage: '/uploads/sample-nurse.jpg',
        overallRating: 4.8,
        appearance: 5,
        attitude: 5,
        knowledge: 4,
        hygiene: 5,
        salary: 4,
        comment: 'Aisha was absolutely wonderful with my newborn. She was gentle, knowledgeable, and very caring. Highly recommended!',
        reviewDate: '2024-09-25T10:00:00Z',
        bookingId: 'BK001'
      },
      {
        id: 2,
        nurseName: 'Fatima Hassan',
        nurseImage: '/uploads/sample-nurse2.jpg',
        overallRating: 4.2,
        appearance: 4,
        attitude: 4,
        knowledge: 4,
        hygiene: 4,
        salary: 5,
        comment: 'Good experience overall. Fatima was professional and my baby was comfortable with her.',
        reviewDate: '2024-09-20T15:30:00Z',
        bookingId: 'BK002'
      }
    ])
    setIsLoading(false)
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
                NurseHire
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/mother/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign In
              </Link>
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
          <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
          <p className="text-gray-600 mt-2">Rate and review the nurses you've hired</p>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600 mb-6">Start by booking and hiring a nurse</p>
              <Link href="/nurses" className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
                Find Nurses
              </Link>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{review.nurseName}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center">
                          {renderStars(review.overallRating)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {review.overallRating}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({getRatingLabel(review.overallRating)})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(review.reviewDate).toLocaleDateString()}
                    </div>
                    <div className="mt-1">Booking #{review.bookingId}</div>
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
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{review.comment}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Review submitted on {new Date(review.reviewDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      Edit Review
                    </button>
                    <button className="text-gray-500 hover:text-gray-700 p-1">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
