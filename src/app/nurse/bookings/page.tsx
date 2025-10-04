'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function NurseBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const res = await fetch('/api/bookings', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setBookings(data.bookings || [])
        }
      } catch (e) {
        console.error('Error loading bookings:', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadBookings()
  }, [])

  const handleBookingAction = async (bookingId: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        // Reload bookings to show updated status
        const bookingsRes = await fetch('/api/bookings', { cache: 'no-store' })
        if (bookingsRes.ok) {
          const data = await bookingsRes.json()
          setBookings(data.bookings || [])
        }
        alert(`Booking ${status.toLowerCase()} successfully!`)
      } else {
        alert('Failed to update booking status. Please try again.')
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      alert('Failed to update booking status. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              NurseHire
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
          <h1 className="nh-h2">Booking Requests</h1>
          <p className="nh-sub mt-1">Manage booking requests from mothers</p>
        </div>

        <div className="space-y-6">
          {bookings.length === 0 ? (
            <div className="text-center py-12 nh-card">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No booking requests yet</h3>
              <p className="text-gray-600">When mothers book you, their requests will appear here</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="nh-card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-medium text-sm">
                          {booking.requester.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{booking.requester.name}</h3>
                        <p className="text-sm text-gray-500">{booking.requester.email}</p>
                      </div>
                    </div>
                    {booking.message && (
                      <p className="text-gray-600 mt-2 mb-3">{booking.message}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Requested: {new Date(booking.createdAt).toLocaleDateString()}</span>
                      <span className={`nh-badge text-xs font-medium ${
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                  {booking.status === 'PENDING' && (
                    <div className="flex space-x-2 ml-4">
                      <button 
                        onClick={() => handleBookingAction(booking.id, 'ACCEPTED')}
                        className="nh-btn nh-btn--primary flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Accept
                      </button>
                      <button 
                        onClick={() => handleBookingAction(booking.id, 'DECLINED')}
                        className="nh-btn flex items-center" style={{background:'#fee2e2',color:'#b91c1c',borderColor:'#fecaca'}}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
