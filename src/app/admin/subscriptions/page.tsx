'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Clock, DollarSign, Search, User, Calendar } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

interface Subscription {
  userId: string
  email: string
  name: string
  status: 'NONE' | 'ACTIVE' | 'EXPIRED'
  startDate: string | null
  endDate: string | null
  amount: number | null
}

interface SubscriptionStats {
  total: number
  active: number
  expired: number
  none: number
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats>({
    total: 0,
    active: 0,
    expired: 0,
    none: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'NONE'>('ALL')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/admin/subscriptions', { cache: 'no-store' })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/auth/login'
          return
        }
        throw new Error('Failed to load subscriptions')
      }
      const data = await res.json()
      setSubscriptions(data.subscriptions || [])
      setStats(data.stats || { total: 0, active: 0, expired: 0, none: 0 })
    } catch (err: any) {
      console.error('Error loading subscriptions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivate = async (userId: string) => {
    if (!confirm('Activate subscription for this user? (15 KD/month)')) return

    try {
      setIsProcessing(userId)
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'activate',
          amount: 15.0,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to activate subscription')
      }

      await loadSubscriptions()
      alert('Subscription activated successfully!')
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Failed to activate subscription'))
    } finally {
      setIsProcessing(null)
    }
  }

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Deactivate subscription for this user?')) return

    try {
      setIsProcessing(userId)
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'deactivate',
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to deactivate subscription')
      }

      await loadSubscriptions()
      alert('Subscription deactivated successfully!')
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Failed to deactivate subscription'))
    } finally {
      setIsProcessing(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'ALL' || sub.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <DashboardHeader />
        <div className="container-custom py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading subscriptions...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader />
      <div className="container-custom py-8">
        <div className="mb-6">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">User Subscriptions</h1>
          <p className="text-neutral-600">Manage user subscriptions and access to premium features</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="nh-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600 mb-1">Total Users</div>
                <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
              </div>
              <User className="w-8 h-8 text-neutral-400" />
            </div>
          </div>

          <div className="nh-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600 mb-1">Active</div>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="nh-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600 mb-1">Expired</div>
                <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="nh-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600 mb-1">No Subscription</div>
                <div className="text-2xl font-bold text-neutral-600">{stats.none}</div>
              </div>
              <Clock className="w-8 h-8 text-neutral-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="nh-card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 nh-input"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="nh-input"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="NONE">No Subscription</option>
            </select>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="nh-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Start Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">End Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Days Left</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-neutral-500">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((sub) => {
                    const daysRemaining = getDaysRemaining(sub.endDate)
                    return (
                      <tr key={sub.userId} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-neutral-900">{sub.name}</div>
                            <div className="text-sm text-neutral-500">{sub.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {sub.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          ) : sub.status === 'EXPIRED' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <XCircle className="w-3 h-3 mr-1" />
                              Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                              <Clock className="w-3 h-3 mr-1" />
                              None
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-neutral-600">{formatDate(sub.startDate)}</td>
                        <td className="py-3 px-4 text-neutral-600">{formatDate(sub.endDate)}</td>
                        <td className="py-3 px-4">
                          {daysRemaining !== null ? (
                            <span className={daysRemaining > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {daysRemaining} days
                            </span>
                          ) : (
                            <span className="text-neutral-400">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-neutral-600">
                          {sub.amount ? `${sub.amount} KD` : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {sub.status !== 'ACTIVE' ? (
                              <button
                                onClick={() => handleActivate(sub.userId)}
                                disabled={isProcessing === sub.userId}
                                className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isProcessing === sub.userId ? 'Processing...' : 'Activate'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeactivate(sub.userId)}
                                disabled={isProcessing === sub.userId}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isProcessing === sub.userId ? 'Processing...' : 'Deactivate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

