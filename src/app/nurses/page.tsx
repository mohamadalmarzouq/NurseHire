'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, Star, MapPin, Clock, Heart, User } from 'lucide-react'

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
        className={`w-4 h-4 ${
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
                  <div key={nurse.id} className="nh-card nh-card--lift">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {nurse.profileImageUrl ? (
                          <img
                            src={nurse.profileImageUrl}
                            alt={nurse.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-primary-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                          {nurse.name}
                        </h3>
                        <p className="text-sm text-neutral-600 mb-2">
                          {nurse.age} years old • {nurse.totalExperience} years experience
                        </p>
                        <div className="flex items-center space-x-1 mb-2">
                          {renderStars(nurse.averageRating)}
                          <span className="text-sm text-neutral-600 ml-2">
                            {nurse.averageRating} ({nurse.reviewCount} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
                      {nurse.aboutMe}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Part-time Rate</p>
                        <p className="font-semibold text-primary-600">
                          {nurse.partTimeSalary} KD/hour
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Night Shift Rate</p>
                        <p className="font-semibold text-primary-600">
                          {nurse.nightShiftSalary} KD/hour
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-neutral-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        Kuwait Experience: {nurse.kuwaitExperience} years
                      </div>
                      <Link
                        href={`/nurses/${nurse.id}`}
                        className="btn-primary text-sm px-4 py-2"
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
