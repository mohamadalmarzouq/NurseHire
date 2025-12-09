'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, Star, User, ArrowLeft, CheckCircle } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

interface CareTaker {
  id: string
  name: string
  age: number
  totalExperience: number
  kuwaitExperience: number
  partTimeSalary: number
  fullTimeSalary: number
  aboutMe: string
  profileImageUrl?: string
  averageRating: number
  reviewCount: number
  languages?: string[]
  skills?: string[]
}

export default function CareTakersPage() {
  const [caretakers, setCaretakers] = useState<CareTaker[]>([])
  const [filteredCaretakers, setFilteredCaretakers] = useState<CareTaker[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    minExperience: '',
    maxSalary: '',
    availability: '',
    skill: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data?.authenticated) {
            setUser(data.user)
            setIsAuthenticated(true)
          } else {
            window.location.href = '/auth/login'
          }
        } else {
          window.location.href = '/auth/login'
        }
      } catch (e) {
        console.error('Error loading user:', e)
        window.location.href = '/auth/login'
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    const loadCaretakers = async () => {
      try {
        const res = await fetch('/api/caretakers', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setCaretakers(data.caretakers || [])
          setFilteredCaretakers(data.caretakers || [])
        }
      } catch (e) {
        console.error('Error loading care takers:', e)
      } finally {
        setIsLoading(false)
      }
    }
    if (isAuthenticated) {
      loadCaretakers()
    }
  }, [isAuthenticated])

  // Filter care takers based on search and filters
  useEffect(() => {
    let filtered = caretakers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(caretaker =>
        caretaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caretaker.aboutMe.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Experience filter
    if (filters.minExperience) {
      filtered = filtered.filter(caretaker => caretaker.totalExperience >= parseInt(filters.minExperience))
    }

    // Salary filter
    if (filters.maxSalary) {
      filtered = filtered.filter(caretaker => caretaker.partTimeSalary <= parseInt(filters.maxSalary))
    }

    // Skills filter
    if (filters.skill) {
      filtered = filtered.filter(caretaker => 
        caretaker.skills && caretaker.skills.includes(filters.skill)
      )
    }

    setFilteredCaretakers(filtered)
  }, [caretakers, searchTerm, filters])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-neutral-300'
        }`}
      />
    ))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading care takers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader userName={user?.profile?.name} userRole={user?.role} />
      
      {/* Header */}
      <div className="bg-white shadow-soft">
        <div className="container-custom py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link 
              href="/user/dashboard" 
              className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to User Dashboard
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Find Your Perfect Care Taker
            </h1>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Browse our verified caretakers and find the perfect match for your care needs
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Trust strip */}
        <div className="nh-card mb-6" style={{background:'linear-gradient(90deg,#F0F9FF,#ECFDF5)'}}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="nh-badge nh-badge--ok">Verified</span>
            <span className="nh-badge nh-badge--info">Private & Secure</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="nh-card sticky top-24">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </h3>

              {/* Search */}
              <div className="mb-6">
                <label className="label">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="nh-input pl-10"
                  />
                </div>
              </div>

              {/* Experience Filter */}
              <div className="mb-6">
                <label className="label">Minimum Experience (years)</label>
                <select
                  value={filters.minExperience}
                  onChange={(e) => setFilters({ ...filters, minExperience: e.target.value })}
                  className="nh-input"
                >
                  <option value="">Any</option>
                  <option value="1">1+ years</option>
                  <option value="3">3+ years</option>
                  <option value="5">5+ years</option>
                  <option value="10">10+ years</option>
                </select>
              </div>

              {/* Salary Filter */}
              <div className="mb-6">
                <label className="label">Maximum Part-time Salary (KD/hour)</label>
                <select
                  value={filters.maxSalary}
                  onChange={(e) => setFilters({ ...filters, maxSalary: e.target.value })}
                  className="nh-input"
                >
                  <option value="">Any</option>
                  <option value="20">Up to 20 KD</option>
                  <option value="25">Up to 25 KD</option>
                  <option value="30">Up to 30 KD</option>
                  <option value="35">Up to 35 KD</option>
                </select>
              </div>

              {/* Skills Filter */}
              <div className="mb-6">
                <label className="label">Skills</label>
                <select
                  value={filters.skill}
                  onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
                  className="nh-input"
                >
                  <option value="">Any</option>
                  <option value="Driver">Driver</option>
                  <option value="Baby Care">Baby Care</option>
                  <option value="Elder Care">Elder Care</option>
                  <option value="Trained Nurse">Trained Nurse</option>
                  <option value="Housekeeper">Housekeeper</option>
                  <option value="Pet care">Pet care</option>
                  <option value="Trained Nanny">Trained Nanny</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilters({ minExperience: '', maxSalary: '', availability: '', skill: '' })
                }}
                className="w-full nh-btn nh-btn--ghost"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Care Takers Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <p className="text-neutral-600">
                Showing {filteredCaretakers.length} of {caretakers.length} care takers
              </p>
            </div>

            {filteredCaretakers.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">No care takers found</h3>
                <p className="text-neutral-600 mb-6">
                  Try adjusting your search criteria or filters
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilters({ minExperience: '', maxSalary: '', availability: '', skill: '' })
                  }}
                  className="btn-primary"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredCaretakers.map((caretaker) => (
                  <div
                    key={caretaker.id}
                    className="nh-card nh-card--lift p-6 space-y-6"
                  >
                    {/* Header */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border border-primary-100 bg-primary-50 overflow-hidden flex items-center justify-center">
                            {caretaker.profileImageUrl ? (
                              <img
                                src={caretaker.profileImageUrl}
                                alt={caretaker.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-8 h-8 text-primary-500" />
                            )}
                          </div>
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-green-500" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                            <h3 className="text-lg font-semibold text-neutral-900 leading-tight line-clamp-1">
                              {caretaker.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 sm:mt-0 mt-1 w-max">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600">
                            {caretaker.age} years old • {caretaker.totalExperience} years experience
                          </p>
                          <p className="text-xs text-neutral-500 line-clamp-2">
                            Languages: {caretaker.languages?.length ? caretaker.languages.join(', ') : 'Not specified'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <span className="flex items-center gap-1 text-primary-500">
                          {renderStars(caretaker.averageRating)}
                        </span>
                        <span className="font-medium text-neutral-800">
                          {caretaker.averageRating}/5
                        </span>
                        <span>• {caretaker.reviewCount} review{caretaker.reviewCount === 1 ? '' : 's'}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-neutral-600">
                      <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                        <p className="uppercase tracking-wide text-neutral-400 mb-1">Part-time</p>
                        <p className="text-base font-semibold text-primary-600">{caretaker.partTimeSalary} KD/hr</p>
                      </div>
                      <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                        <p className="uppercase tracking-wide text-neutral-400 mb-1">Full-time</p>
                        <p className="text-base font-semibold text-primary-600">{caretaker.fullTimeSalary} KD/hr</p>
                      </div>
                      <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                        <p className="uppercase tracking-wide text-neutral-400 mb-1">Kuwait Exp.</p>
                        <p className="text-base font-semibold text-neutral-800">{caretaker.kuwaitExperience} yrs</p>
                      </div>
                      <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                        <p className="uppercase tracking-wide text-neutral-400 mb-1">Total Exp.</p>
                        <p className="text-base font-semibold text-neutral-800">{caretaker.totalExperience} yrs</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                      <Link
                        href={`/caretakers/${caretaker.id}`}
                        className="nh-btn nh-btn--primary text-center w-full sm:w-auto"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
