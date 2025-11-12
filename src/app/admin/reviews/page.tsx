'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, CheckCircle, XCircle, Clock, User, MessageSquare } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data?.authenticated) setUser(data.user)
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadUser()
    loadReviews()
  }, [statusFilter])

  const loadReviews = async () => {
    try {
      const url = statusFilter ? `/api/admin/reviews?status=${statusFilter}` : '/api/admin/reviews'
      const response = await fetch(url, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveReject = async (reviewId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`Are you sure you want to ${status === 'APPROVED' ? 'approve' : 'reject'} this review?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          status,
        }),
      })

      if (response.ok) {
        alert(`Review ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully!`)
        await loadReviews()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update review status')
      }
    } catch (error) {
      console.error('Error updating review:', error)
      alert('Failed to update review status')
    }
  }

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'REJECTED': return <XCircle className="w-5 h-5 text-red-600" />
      case 'PENDING': return <Clock className="w-5 h-5 text-yellow-600" />
      default: return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
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
      <DashboardHeader userName={user?.profile?.name} userRole={user?.role} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Review Management</h1>
              <p className="text-gray-600 mt-2">Approve or reject user reviews for nurses</p>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-1" />
                Pending ({reviews.filter(r => r.status === 'PENDING').length})
              </button>
              <button
                onClick={() => setStatusFilter('APPROVED')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'APPROVED'
                    ? 'bg-green-100 text-green-800 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Approved ({reviews.filter(r => r.status === 'APPROVED').length})
              </button>
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'REJECTED'
                    ? 'bg-red-100 text-red-800 border-2 border-red-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <XCircle className="w-4 h-4 inline mr-1" />
                Rejected ({reviews.filter(r => r.status === 'REJECTED').length})
              </button>
              <button
                onClick={() => setStatusFilter('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === ''
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Reviews
              </button>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
              <p className="text-gray-600">
                {statusFilter ? `No ${statusFilter.toLowerCase()} reviews at this time.` : 'No reviews available.'}
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Review by {review.giver.name}
                        </h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(review.status)}`}>
                          {review.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Reviewing: <span className="font-medium">{review.receiver.name}</span>
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {renderStars(review.averageRating)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {review.averageRating.toFixed(1)}/5.0
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center">
                      {getStatusIcon(review.status)}
                      <span className="ml-1">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detailed Ratings */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Appearance</div>
                    <div className="flex justify-center">
                      {renderStars(review.appearance)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{review.appearance}/5</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Attitude</div>
                    <div className="flex justify-center">
                      {renderStars(review.attitude)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{review.attitude}/5</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Knowledge</div>
                    <div className="flex justify-center">
                      {renderStars(review.knowledge)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{review.knowledge}/5</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Hygiene</div>
                    <div className="flex justify-center">
                      {renderStars(review.hygiene)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{review.hygiene}/5</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Salary Value</div>
                    <div className="flex justify-center">
                      {renderStars(review.salary)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{review.salary}/5</div>
                  </div>
                </div>

                {/* Comment */}
                {review.comment && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {review.status === 'PENDING' && (
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleApproveReject(review.id, 'REJECTED')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveReject(review.id, 'APPROVED')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

