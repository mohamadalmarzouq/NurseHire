'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, Star, MapPin, Clock, Heart, User, ArrowLeft } from 'lucide-react'

interface Nurse {
  id: string
  name: string
  age: number
  totalExperience: number
  kuwaitExperience: number
  partTimeSalary: number
  nightShiftSalary: number
  aboutMe: string
  profileImageUrl?: string
  averageRating: number
  reviewCount: number
}

export default function NursesPage() {
  const [nurses, setNurses] = useState<Nurse[]>([])
  const [filteredNurses, setFilteredNurses] = useState<Nurse[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    minExperience: '',
    maxSalary: '',
    availability: '',
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadNurses = async () => {
      try {
        const res = await fetch('/api/nurses', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setNurses(data.nurses || [])
          setFilteredNurses(data.nurses || [])
        }
      } catch (e) {
        console.error('Error loading nurses:', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadNurses()
  }, [])

  // Filter nurses based on search and filters
  useEffect(() => {
    let filtered = nurses

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(nurse =>
        nurse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nurse.aboutMe.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Experience filter
    if (filters.minExperience) {
      filtered = filtered.filter(nurse => nurse.totalExperience >= parseInt(filters.minExperience))
    }

    // Salary filter
    if (filters.maxSalary) {
      filtered = filtered.filter(nurse => nurse.partTimeSalary <= parseInt(filters.maxSalary))
    }

    setFilteredNurses(filtered)
  }, [nurses, searchTerm, filters])

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
          <p className="text-neutral-600">Loading nurses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow-soft">
        <div className="container-custom py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link 
              href="/mother/dashboard" 
              className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Mother Dashboard
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Find Your Perfect Nurse
            </h1>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Browse through our verified nurses and find the perfect match for your newborn's care
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Trust strip */}
        <div className="nh-card mb-6" style={{background:'linear-gradient(90deg,#F0F9FF,#ECFDF5)'}}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="nh-badge nh-badge--ok">MOH Verified</span>
            <span className="nh-badge nh-badge--info">Private & Secure</span>
            <span className="nh-badge nh-badge--warn">No Payments (Phase 1)</span>
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

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilters({ minExperience: '', maxSalary: '', availability: '' })
                }}
                className="w-full nh-btn nh-btn--ghost"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Nurses Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <p className="text-neutral-600">
                Showing {filteredNurses.length} of {nurses.length} nurses
              </p>
            </div>

            {filteredNurses.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">No nurses found</h3>
                <p className="text-neutral-600 mb-6">
                  Try adjusting your search criteria or filters
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilters({ minExperience: '', maxSalary: '', availability: '' })
                  }}
                  className="btn-primary"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredNurses.map((nurse) => (
                  <div key={nurse.id} className="nh-card nh-card--lift p-5">
                    {/* Top Section - Name and Basic Info */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {nurse.profileImageUrl ? (
                          <img
                            src={nurse.profileImageUrl}
                            alt={nurse.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{nurse.name}</h3>
                        <p className="text-sm text-gray-600">{nurse.age} years old • {nurse.totalExperience} years exp</p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="flex items-center space-x-1">
                        {renderStars(nurse.averageRating)}
                      </div>
                      <span className="text-xs text-gray-500">
                        {nurse.averageRating}/5 • {nurse.reviewCount} reviews
                      </span>
                    </div>

                    {/* Rates */}
                    <div className="flex justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center flex-1">
                        <p className="text-xs text-gray-500">Part-time</p>
                        <p className="font-bold text-blue-600">{nurse.partTimeSalary} KD/hr</p>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-xs text-gray-500">Night Shift</p>
                        <p className="font-bold text-blue-600">{nurse.nightShiftSalary} KD/hr</p>
                      </div>
                    </div>

                    {/* Kuwait Experience */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>Kuwait: {nurse.kuwaitExperience} years</span>
                      </div>
                    </div>

                    {/* View Profile Button */}
                    <Link 
                      href={`/nurses/${nurse.id}`} 
                      className="w-full nh-btn nh-btn--primary text-center block"
                    >
                      View Profile
                    </Link>
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
