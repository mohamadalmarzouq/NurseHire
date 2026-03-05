'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, Star, User, ArrowLeft, CheckCircle } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { useLanguage } from '@/lib/language'

interface Candidate {
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

export default function CandidatesPage() {
  const { t } = useLanguage()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
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
          }
        }
      } catch (e) {
        console.error('Error loading user:', e)
        // Don't redirect - allow public browsing
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/candidates', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setCandidates(data.candidates || [])
          setFilteredCandidates(data.candidates || [])
        }
      } catch (e) {
        console.error('Error loading candidates:', e)
      } finally {
        setIsLoading(false)
      }
    }
    // Load candidates regardless of authentication status
    loadCandidates()
  }, [])

  // Filter candidates based on search and filters
  useEffect(() => {
    let filtered = candidates

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(candidate =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.aboutMe.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Experience filter
    if (filters.minExperience) {
      filtered = filtered.filter(candidate => candidate.totalExperience >= parseInt(filters.minExperience))
    }

    // Salary filter
    if (filters.maxSalary) {
      filtered = filtered.filter(candidate => candidate.partTimeSalary <= parseInt(filters.maxSalary))
    }

    // Skills filter
    if (filters.skill) {
      filtered = filtered.filter(candidate => 
        candidate.skills && candidate.skills.includes(filters.skill)
      )
    }

    setFilteredCandidates(filtered)
  }, [candidates, searchTerm, filters])

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
          <p className="text-neutral-600">Loading candidates...</p>
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
          {isAuthenticated && (
            <div className="mb-6">
            <Link 
              href="/user/dashboard" 
              className="btn-primary inline-flex items-center"
              style={{ background: '#06B6D4' }}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('candidates.backToDashboard')}
              </Link>
            </div>
          )}
          
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              {t('candidates.title')}
            </h1>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              {t('candidates.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Sign-up Banner for non-authenticated users */}
        {!isAuthenticated && (
          <div className="nh-card mb-6" style={{background:'linear-gradient(135deg,#0E7490,#0891B2)'}}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">{t('candidates.profile.signUpToContact')}</h3>
                <p className="text-white/90 text-sm">{t('candidates.profile.signUpToContactDesc')}</p>
              </div>
              <Link href="/auth/register" className="px-6 py-2 bg-white text-cyan-700 rounded-lg font-medium hover:bg-gray-50 transition-colors whitespace-nowrap">
                {t('candidates.profile.signUpFree')}
              </Link>
            </div>
          </div>
        )}

        {/* Trust strip */}
        <div className="nh-card mb-6" style={{background:'linear-gradient(90deg,#ECFEFF,#CFFAFE)'}}>
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
                {t('candidates.filters.title')}
              </h3>

              {/* Search */}
              <div className="mb-6">
                <label className="label">{t('candidates.filters.search')}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder={t('candidates.filters.searchPlaceholder')}
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

          {/* Candidates Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <p className="text-neutral-600">
                Showing {filteredCandidates.length} of {candidates.length} candidates
              </p>
            </div>

            {filteredCandidates.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">{t('candidates.noResults')}</h3>
                <p className="text-neutral-600 mb-6">
                  {t('candidates.noResultsDesc')}
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilters({ minExperience: '', maxSalary: '', availability: '', skill: '' })
                  }}
                  className="btn-primary"
                >
                  {t('candidates.clearFilters')}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="nh-card nh-card--lift p-6 space-y-6"
                  >
                    {/* Header */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border border-primary-100 bg-primary-50 overflow-hidden flex items-center justify-center">
                            {candidate.profileImageUrl ? (
                              <img
                                src={candidate.profileImageUrl}
                                alt={candidate.name}
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
                              {candidate.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 sm:mt-0 mt-1 w-max">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600">
                            {candidate.age} {t('candidates.profile.yearsOld')} • {candidate.totalExperience} {t('candidates.profile.yearsExperience')}
                          </p>
                          <p className="text-xs text-neutral-500 line-clamp-2">
                            {t('candidates.profile.languages')}: {candidate.languages?.length ? candidate.languages.join(', ') : t('candidate.profile.notSet')}
                          </p>
                        </div>
                      </div>
                      {isAuthenticated && candidate.averageRating !== null && (
                        <div className="flex items-center gap-2 text-xs text-neutral-600">
                          <span className="flex items-center gap-1 text-primary-500">
                            {renderStars(candidate.averageRating)}
                          </span>
                          <span className="font-medium text-neutral-800">
                            {candidate.averageRating}/5
                          </span>
                          <span>• {candidate.reviewCount} review{candidate.reviewCount === 1 ? '' : 's'}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-neutral-600">
                      <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                        <p className="uppercase tracking-wide text-neutral-400 mb-1">{t('candidates.profile.partTimeRate')}</p>
                        <p className="text-base font-semibold text-primary-600">{candidate.partTimeSalary} KD/hr</p>
                      </div>
                      <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                        <p className="uppercase tracking-wide text-neutral-400 mb-1">{t('candidates.profile.fullTimeRate')}</p>
                        <p className="text-base font-semibold text-primary-600">{candidate.fullTimeSalary} KD/hr</p>
                      </div>
                      <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                        <p className="uppercase tracking-wide text-neutral-400 mb-1">Kuwait Exp.</p>
                        <p className="text-base font-semibold text-neutral-800">{candidate.kuwaitExperience} yrs</p>
                      </div>
                      <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                        <p className="uppercase tracking-wide text-neutral-400 mb-1">Total Exp.</p>
                        <p className="text-base font-semibold text-neutral-800">{candidate.totalExperience} yrs</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                      <Link
                        href={`/candidates/${candidate.id}`}
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
