'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Clock, Calendar, DollarSign } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

interface Subscription {
  status: 'NONE' | 'ACTIVE' | 'EXPIRED'
  startDate: string | null
  endDate: string | null
  amount: number | null
  isActive: boolean
}

export default function UserSubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/user/subscription', { cache: 'no-store' })
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/auth/login'
          return
        }
        throw new Error('Failed to load subscription')
      }
      const data = await res.json()
      setSubscription(data.subscription)
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <section className="nh-section">
          <div className="nh-container">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading subscription...</p>
            </div>
          </div>
          </div>
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <section className="nh-section">
          <div className="nh-container">
          <div className="nh-card">
            <div className="text-center py-8">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Error</h2>
              <p className="text-neutral-600 mb-6">{error}</p>
              <button
                onClick={loadSubscription}
                className="nh-btn nh-btn--primary"
              >
                Try Again
              </button>
            </div>
          </div>
          </div>
        </section>
      </div>
    )
  }

  const daysRemaining = subscription?.endDate ? getDaysRemaining(subscription.endDate) : null
  const isActive = subscription?.isActive || false

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <section className="nh-section">
      <div className="nh-container">
        <div className="mb-6">
          <Link
            href="/user/dashboard"
            className="inline-flex items-center text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <div className="max-w-3xl mx-auto">
          <h1 className="nh-h1 mb-8">My Subscription</h1>

          {/* Subscription Status Card */}
          <div className="nh-card mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Subscription Status</h2>
                <div className="flex items-center space-x-2">
                  {isActive ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-lg font-medium text-green-600">Active</span>
                    </>
                  ) : subscription?.status === 'EXPIRED' ? (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-lg font-medium text-red-600">Expired</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-neutral-400" />
                      <span className="text-lg font-medium text-neutral-600">No Active Subscription</span>
                    </>
                  )}
                </div>
              </div>
              {isActive && daysRemaining !== null && (
                <div className="text-right">
                  <div className="text-sm text-neutral-600 mb-1">Days Remaining</div>
                  <div className="text-2xl font-bold text-primary-600">{daysRemaining}</div>
                </div>
              )}
            </div>

            {/* Subscription Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-neutral-200">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-neutral-400 mt-0.5" />
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Start Date</div>
                  <div className="font-medium text-neutral-900">
                    {formatDate(subscription?.startDate || null)}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-neutral-400 mt-0.5" />
                <div>
                  <div className="text-sm text-neutral-600 mb-1">End Date</div>
                  <div className="font-medium text-neutral-900">
                    {formatDate(subscription?.endDate || null)}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <DollarSign className="w-5 h-5 text-neutral-400 mt-0.5" />
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Monthly Fee</div>
                  <div className="font-medium text-neutral-900">
                    {subscription?.amount ? `${subscription.amount} KD/month` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Card */}
          <div className="nh-card mb-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Subscription Benefits</h2>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-neutral-700">View care taker phone numbers</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-neutral-700">Send messages directly to care takers</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-neutral-700">Full access to contact information</span>
              </li>
            </ul>
          </div>

          {/* Action Card */}
          {!isActive && (
            <div className="nh-card bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
            <div className="text-center py-6">
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Ready to Get Started?
              </h3>
              <p className="text-neutral-600 mb-6">
                Contact admin to activate your subscription for 15 KD/month
              </p>
              <div className="text-sm text-neutral-500">
                Your subscription will be activated by an administrator after payment confirmation.
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
      </section>
    </div>
  )
}

