'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star } from 'lucide-react'

export default function NurseReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await fetch('/api/reviews?type=received', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setReviews(data.reviews || [])
        }
      } catch (e) {
        console.error('Error loading reviews:', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadReviews()
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary-600 no-underline">
              ENFAS
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/nurse/dashboard" className="text-gray-600 hover:text-gray-900">
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
        <div className="mb-8">
          <Link href="/nurse/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="nh-h2">My Reviews</h1>
          <p className="nh-sub mt-1">See what users are saying about you</p>
        </div>

        <div className="nh-card">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">After users work with you, they can leave reviews here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="nh-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-medium text-sm">
                          {review.giver.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{review.giver.name}</h3>
                        <p className="text-sm text-gray-500">User</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 mb-1">
                        {renderStars(review.averageRating)}
                      </div>
                      <span className="nh-badge nh-badge--info">
                        {review.averageRating.toFixed(1)}/5
                      </span>
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
                      <div className="text-sm text-gray-600 mb-1">Salary Value</div>
                      <div className="flex justify-center">
                        {renderStars(review.salary)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{review.salary}/5</div>
                    </div>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 text-sm leading-relaxed">"{review.comment}"</p>
                    </div>
                  )}

                  {/* Review Date */}
                  <div className="text-xs text-gray-500 mt-4">
                    Review submitted on {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
