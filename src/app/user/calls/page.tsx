'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Calendar, Video } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

export default function UserCallsPage() {
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCalls()
  }, [])

  const loadCalls = async () => {
    try {
      const response = await fetch('/api/calls', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setCalls(data.calls || [])
      }
    } catch (error) {
      console.error('Error loading calls:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (callId: string) => {
    if (!confirm('Cancel this call request?')) return
    try {
      const response = await fetch(`/api/calls/${callId}/cancel`, { method: 'PUT' })
      if (response.ok) {
        await loadCalls()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to cancel call')
      }
    } catch (error) {
      console.error('Error canceling call:', error)
      alert('Failed to cancel call')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'ACCEPTED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'CANCELED':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'CANCELED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatusLabel = (status: string) => {
    return status.replace('_', ' ').toLowerCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your calls...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/user/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="nh-h1">My Calls</h1>
          <p className="nh-sub">Track your scheduled video call requests</p>
        </div>

        {calls.length === 0 ? (
          <div className="nh-card text-center py-12">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Calls Yet</h3>
            <p className="text-gray-600 mb-6">
              Schedule a video call from a caretaker profile once your request is submitted.
            </p>
            <Link href="/caretakers" className="nh-btn nh-btn--primary">
              Browse Care Takers
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {calls.map((call) => (
              <div key={call.id} className="nh-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Call with {call.caretaker?.caretakerProfile?.name || 'Care Taker'}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}
                      >
                        {getStatusIcon(call.status)}
                        {formatStatusLabel(call.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(call.scheduledAt).toLocaleString()} ({call.timezone})
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Duration: {call.durationMinutes} minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Requested on {new Date(call.createdAt).toLocaleDateString()}</span>
                  {['REQUESTED', 'ACCEPTED'].includes(call.status) && (
                    <button
                      onClick={() => handleCancel(call.id)}
                      className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
