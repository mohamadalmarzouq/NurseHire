'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, CheckCircle, XCircle, Clock, Settings, LogOut, Eye, UserCheck, AlertTriangle, MessageCircle } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalNurses: 0,
    pendingApprovals: 0,
    approvedNurses: 0,
    totalMothers: 0,
    totalRequests: 0
  })
  const [pendingNurses, setPendingNurses] = useState<any[]>([])

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
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/admin/stats', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setStats(data.stats)
        }
      } catch (e) {
        console.error('Error loading stats:', e)
      }
    }
    loadStats()
  }, [])

  useEffect(() => {
    const loadPendingNurses = async () => {
      try {
        const res = await fetch('/api/admin/pending-nurses', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setPendingNurses(data.nurses)
        }
      } catch (e) {
        console.error('Error loading pending nurses:', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadPendingNurses()
  }, [])

  const handleApproveNurse = async (nurseId: string) => {
    try {
      const res = await fetch(`/api/admin/nurses/${nurseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (res.ok) {
        // Remove from pending list and update stats
        setPendingNurses(prev => prev.filter(nurse => nurse.id !== nurseId))
        setStats(prev => ({
          ...prev,
          pendingApprovals: prev.pendingApprovals - 1,
          approvedNurses: prev.approvedNurses + 1
        }))
        alert('Nurse approved successfully!')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to approve nurse')
      }
    } catch (error) {
      console.error('Error approving nurse:', error)
      alert('Failed to approve nurse')
    }
  }

  const handleRejectNurse = async (nurseId: string) => {
    try {
      const res = await fetch(`/api/admin/nurses/${nurseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
      })

      if (res.ok) {
        // Remove from pending list and update stats
        setPendingNurses(prev => prev.filter(nurse => nurse.id !== nurseId))
        setStats(prev => ({
          ...prev,
          pendingApprovals: prev.pendingApprovals - 1
        }))
        alert('Nurse rejected successfully!')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to reject nurse')
      }
    } catch (error) {
      console.error('Error rejecting nurse:', error)
      alert('Failed to reject nurse')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userName={user?.adminProfile?.name} userRole={user?.role} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage nurse approvals, monitor platform activity, and oversee the community.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Nurses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalNurses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved Nurses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedNurses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Mothers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMothers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRequests || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Nurse Approvals */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Nurse Approvals</h2>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {stats.pendingApprovals} pending
            </span>
          </div>
          
          {pendingNurses.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">No pending approvals</p>
              <p className="text-sm text-gray-500">All nurse applications have been reviewed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingNurses.map((nurse) => (
                <div key={nurse.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{nurse.name}</h3>
                      <p className="text-sm text-gray-600">{nurse.email}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>{nurse.totalExperience} years total experience</span>
                        <span>{nurse.kuwaitExperience} years in Kuwait</span>
                        <span>KD {nurse.partTimeSalary}/hour part-time</span>
                        <span>Submitted {new Date(nurse.submittedAt).toLocaleDateString()}</span>
                      </div>
                      {nurse.aboutMe && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">{nurse.aboutMe}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link 
                        href={`/nurses/${nurse.id}`}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        View Profile
                      </Link>
                      <button
                        onClick={() => handleApproveNurse(nurse.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectNurse(nurse.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <XCircle className="w-4 h-4 inline mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/admin/nurses" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Manage Nurses</h3>
                <p className="text-gray-600 text-sm">View all nurses</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/mothers" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Manage Mothers</h3>
                <p className="text-gray-600 text-sm">View all mothers</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/requests" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Manage Requests</h3>
                <p className="text-gray-600 text-sm">View and respond to information requests</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/settings" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Platform Settings</h3>
                <p className="text-gray-600 text-sm">Configure platform</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
