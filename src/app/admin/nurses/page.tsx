'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, CheckCircle, XCircle, Clock, Eye, Search, Filter, Trash2 } from 'lucide-react'

export default function AdminCaretakersPage() {
  const [caretakers, setCaretakers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

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
    const loadCaretakers = async () => {
      try {
        const res = await fetch('/api/admin/caretakers', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setCaretakers(data.caretakers || [])
        }
      } catch (e) {
        console.error('Error loading care takers:', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadCaretakers()
  }, [])

  const filteredCaretakers = caretakers.filter(caretaker => {
    const matchesSearch = caretaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caretaker.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || caretaker.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDeleteCaretaker = async (caretakerId: string) => {
    if (!confirm('Are you sure you want to delete this care taker account? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/users/${caretakerId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setCaretakers(prev => prev.filter(caretaker => caretaker.id !== caretakerId))
        alert('Care taker account deleted successfully')
      } else {
        const data = await res.json().catch(() => null)
        alert(data?.error || 'Failed to delete care taker account')
      }
    } catch (error) {
      console.error('Error deleting care taker:', error)
      alert('Failed to delete care taker account')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-100'
      case 'PENDING': return 'text-yellow-600 bg-yellow-100'
      case 'REJECTED': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'REJECTED': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading care takers...</p>
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
              <Link href="/" className="text-2xl font-bold text-primary-600 no-underline">
                ENFAS Admin
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <button 
                onClick={() => {
                  document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
                  window.location.href = '/auth/login'
                }}
                className="text-red-500 hover:text-red-700"
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
          <Link href="/admin/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Manage Care Takers</h1>
          <p className="text-gray-600 mt-2">View and manage all care taker profiles</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search care takers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Care Takers List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredCaretakers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No care takers found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Care Taker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCaretakers.map((caretaker) => {
                    const caretakerName = caretaker.name || 'Unknown'
                    const initials = caretakerName
                      .split(' ')
                      .filter(Boolean)
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase() || 'C'

                    return (
                    <tr key={caretaker.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {initials}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{caretakerName}</div>
                            <div className="text-sm text-gray-500">{caretaker.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{caretaker.totalExperience} years total</div>
                        <div className="text-gray-500">{caretaker.kuwaitExperience} years in Kuwait</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>KD {caretaker.partTimeSalary}/hour part-time</div>
                        <div className="text-gray-500">KD {caretaker.fullTimeSalary}/hour full-time</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caretaker.status)}`}>
                          {getStatusIcon(caretaker.status)}
                          <span className="ml-1">{caretaker.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(caretaker.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/caretakers/${caretaker.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Eye className="w-4 h-4 inline mr-1" />
                            View Details
                          </Link>
                          <button
                            onClick={() => handleDeleteCaretaker(caretaker.id)}
                            className="text-red-600 hover:text-red-800 inline-flex items-center"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
