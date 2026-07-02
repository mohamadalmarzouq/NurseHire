'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bot, CheckCircle, Clock, Star, User, Video, X } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { useLanguage } from '@/lib/language'

interface CandidateOption {
  id: string
  name: string
  age: number
  totalExperience: number
  kuwaitExperience: number
  partTimeSalary: number
  fullTimeSalary: number
  languages: string[]
  profileImageUrl?: string | null
  averageRating: number | null
  reviewCount: number | null
}

export default function UserAiInterviewsPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [candidates, setCandidates] = useState<CandidateOption[]>([])
  const [candidateSearch, setCandidateSearch] = useState('')
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([])
  const [interviews, setInterviews] = useState<any[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewCandidate, setPreviewCandidate] = useState<any | null>(null)
  const [previewReviews, setPreviewReviews] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
  })

  const loadCandidates = async () => {
    try {
      const res = await fetch('/api/candidates', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setCandidates(
          (data.candidates || []).map((candidate: any) => ({
            id: candidate.id,
            name: candidate.name || 'Candidate',
            age: candidate.age || 0,
            totalExperience: candidate.totalExperience || 0,
            kuwaitExperience: candidate.kuwaitExperience || 0,
            partTimeSalary: candidate.partTimeSalary || 0,
            fullTimeSalary: candidate.fullTimeSalary || 0,
            languages: candidate.languages || [],
            profileImageUrl: candidate.profileImageUrl || null,
            averageRating: candidate.averageRating ?? null,
            reviewCount: candidate.reviewCount ?? null,
          }))
        )
      }
    } catch (error) {
      console.error('Error loading candidates:', error)
    }
  }

  const loadInterviews = async () => {
    try {
      const res = await fetch('/api/ai-interviews', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setInterviews(data.interviews || [])
      }
    } catch (error) {
      console.error('Error loading AI interviews:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCandidates()
    loadInterviews()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (selectedCandidateIds.length === 0) {
      alert('Please select at least one candidate.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/ai-interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateIds: selectedCandidateIds,
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        alert(data?.error || 'Failed to create interview')
        return
      }

      setFormData({ title: '', description: '', requirements: '' })
      setSelectedCandidateIds([])
      await loadInterviews()
    } catch (error) {
      console.error('Error creating interview:', error)
      alert('Failed to create interview')
    } finally {
      setSaving(false)
    }
  }

  const renderStatus = (status: string) => {
    if (status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          Completed
        </span>
      )
    }
    if (status === 'RUNNING') {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
          <Clock className="mr-1 h-3 w-3" />
          In Progress
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
        <Clock className="mr-1 h-3 w-3" />
        Scheduled
      </span>
    )
  }

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

  const filteredCandidates = candidates.filter((candidate) =>
    candidate.name.toLowerCase().includes(candidateSearch.trim().toLowerCase())
  )
  const allVisibleSelected =
    filteredCandidates.length > 0 &&
    filteredCandidates.every((candidate) => selectedCandidateIds.includes(candidate.id))

  const toggleCandidate = (candidateId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candidateId) ? prev.filter((id) => id !== candidateId) : [...prev, candidateId]
    )
  }

  const toggleAllVisibleCandidates = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredCandidates.map((candidate) => candidate.id))
      setSelectedCandidateIds((prev) => prev.filter((id) => !visibleIds.has(id)))
      return
    }
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev)
      filteredCandidates.forEach((candidate) => next.add(candidate.id))
      return Array.from(next)
    })
  }

  const openCandidatePreview = async (candidateId: string) => {
    setPreviewOpen(true)
    setPreviewLoading(true)
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, { cache: 'no-store' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        alert(data?.error || 'Unable to load candidate profile')
        setPreviewOpen(false)
        return
      }
      const data = await res.json()
      setPreviewCandidate(data?.candidate || null)
      setPreviewReviews(data?.reviews || [])
    } catch (error) {
      console.error('Error loading candidate profile:', error)
      alert('Unable to load candidate profile')
      setPreviewOpen(false)
    } finally {
      setPreviewLoading(false)
    }
  }

  const closePreview = () => {
    setPreviewOpen(false)
    setPreviewCandidate(null)
    setPreviewReviews([])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading AI interviews...</p>
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
        <div
          className="mb-8 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 p-6"
          style={{ boxShadow: '0 12px 30px rgba(6, 182, 212, 0.12)' }}
        >
          <Link
            href="/user/dashboard"
            className="inline-flex items-center text-sm text-cyan-700 hover:text-cyan-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                boxShadow: '0 8px 20px rgba(6, 182, 212, 0.35)',
              }}
            >
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
                {t('user.dashboard.aiInterviews')}
              </h1>
              <p className="text-sm text-slate-600">{t('user.dashboard.aiInterviewsDesc')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <div
              className="rounded-2xl border p-5"
              style={{
                background: 'linear-gradient(135deg, #ECFEFF 0%, #F0FDFF 100%)',
                borderColor: '#A5F3FC',
                boxShadow: '0 12px 24px rgba(6, 182, 212, 0.12)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-cyan-700" />
                <h2 className="text-lg font-semibold text-slate-900">Create AI Interview</h2>
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Candidate
                  </label>
                  <div className="space-y-3">
                    <input
                      className="w-full rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                      placeholder="Search candidates..."
                      value={candidateSearch}
                      onChange={(event) => setCandidateSearch(event.target.value)}
                    />
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-cyan-200 text-cyan-600 focus:ring-cyan-200"
                          checked={allVisibleSelected}
                          onChange={toggleAllVisibleCandidates}
                        />
                        Select all visible
                      </label>
                      <span>{selectedCandidateIds.length} selected</span>
                    </div>
                    <div
                      className="max-h-96 overflow-y-auto space-y-4 rounded-xl border p-3"
                      style={{ borderColor: '#A5F3FC', background: 'rgba(236, 254, 255, 0.7)' }}
                    >
                      {filteredCandidates.length === 0 ? (
                        <div className="text-sm text-slate-500 px-2 py-3">
                          No candidates found.
                        </div>
                      ) : (
                        filteredCandidates.map((candidate) => {
                          const isSelected = selectedCandidateIds.includes(candidate.id)
                          return (
                            <button
                              key={candidate.id}
                              type="button"
                              onClick={() => toggleCandidate(candidate.id)}
                              className={`nh-card nh-card--lift p-4 space-y-4 w-full text-left transition ${
                                isSelected ? 'ring-2 ring-primary-200' : ''
                              }`}
                            >
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
                                      {candidate.age} years old • {candidate.totalExperience} years
                                      experience
                                    </p>
                                    <p className="text-xs text-neutral-500 line-clamp-2">
                                      Languages:{' '}
                                      {candidate.languages?.length
                                        ? candidate.languages.join(', ')
                                        : 'Not specified'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                                    <span className="flex items-center gap-1 text-primary-500">
                                      {renderStars(candidate.averageRating ?? 0)}
                                    </span>
                                    <span className="font-medium text-neutral-800">
                                      {(candidate.averageRating ?? 0).toFixed(1)}/5
                                    </span>
                                    <span>
                                      • {candidate.reviewCount ?? 0} review
                                      {candidate.reviewCount === 1 ? '' : 's'}
                                    </span>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(event) => {
                                      event.stopPropagation()
                                      toggleCandidate(candidate.id)
                                    }}
                                    onClick={(event) => event.stopPropagation()}
                                    className="h-4 w-4 rounded border-cyan-200 text-cyan-600 focus:ring-cyan-200"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-neutral-600">
                                <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                                  <p className="uppercase tracking-wide text-neutral-400 mb-1">Part-time</p>
                                  <p className="text-base font-semibold text-primary-600">
                                    {candidate.partTimeSalary} KD/hr
                                  </p>
                                </div>
                                <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                                  <p className="uppercase tracking-wide text-neutral-400 mb-1">Full-time</p>
                                  <p className="text-base font-semibold text-primary-600">
                                    {candidate.fullTimeSalary} KD/hr
                                  </p>
                                </div>
                                <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                                  <p className="uppercase tracking-wide text-neutral-400 mb-1">
                                    Kuwait Exp.
                                  </p>
                                  <p className="text-base font-semibold text-neutral-800">
                                    {candidate.kuwaitExperience} yrs
                                  </p>
                                </div>
                                <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                                  <p className="uppercase tracking-wide text-neutral-400 mb-1">
                                    Total Exp.
                                  </p>
                                  <p className="text-base font-semibold text-neutral-800">
                                    {candidate.totalExperience} yrs
                                  </p>
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    openCandidatePreview(candidate.id)
                                  }}
                                  className="nh-btn nh-btn--primary text-center w-full sm:w-auto"
                                >
                                  View Profile
                                </button>
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Job Title
                  </label>
                  <input
                    className="w-full rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    value={formData.title}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, title: event.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Job Description
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200 min-h-[110px]"
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, description: event.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Requirements (optional)
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200 min-h-[80px]"
                    value={formData.requirements}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, requirements: event.target.value }))
                    }
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving || selectedCandidateIds.length === 0}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Creating...' : 'Create Interview'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div
              className="rounded-2xl border p-5"
              style={{
                background: 'linear-gradient(135deg, #ECFEFF 0%, #F0FDFF 100%)',
                borderColor: '#A5F3FC',
                boxShadow: '0 12px 24px rgba(6, 182, 212, 0.12)',
              }}
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Interviews</h2>
              {interviews.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No AI interviews created yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {interviews.map((interview) => {
                    const session = interview.sessions?.[0]
                    const candidateName =
                      interview.candidate?.candidateProfile?.name || 'Candidate'
                    return (
                      <div
                        key={interview.id}
                        className="rounded-2xl border p-4 flex flex-col gap-3"
                        style={{
                          background: 'linear-gradient(135deg, #ECFEFF 0%, #F0FDFF 100%)',
                          borderColor: '#A5F3FC',
                          boxShadow: '0 10px 18px rgba(15, 23, 42, 0.08)',
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">{interview.title}</h3>
                            <p className="text-sm text-slate-500">{candidateName}</p>
                          </div>
                          {renderStatus(interview.status)}
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {interview.description}
                        </p>
                        <div className="flex items-center gap-3">
                          {session?.recordingUrl ? (
                            <a
                              href={session.recordingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-sm text-cyan-700 hover:text-cyan-800"
                            >
                              <Video className="w-4 h-4 mr-1" />
                              Replay Interview
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">Recording not available yet</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {previewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900">Candidate Profile</h3>
                  {previewCandidate?.name && (
                    <p className="text-sm text-neutral-600">{previewCandidate.name}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={closePreview}
                  className="rounded-full border border-neutral-200 p-2 text-neutral-600 hover:bg-neutral-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {previewLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                </div>
              ) : previewCandidate ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border border-primary-100 bg-primary-50 overflow-hidden flex items-center justify-center">
                          {previewCandidate.profileImageUrl ? (
                            <img
                              src={previewCandidate.profileImageUrl}
                              alt={previewCandidate.name}
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
                          <h4 className="text-lg font-semibold text-neutral-900 leading-tight">
                            {previewCandidate.name}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 sm:mt-0 mt-1 w-max">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600">
                          {previewCandidate.age} years old • {previewCandidate.totalExperience} years
                          experience
                        </p>
                        <p className="text-xs text-neutral-500">
                          Languages:{' '}
                          {previewCandidate.languages?.length
                            ? previewCandidate.languages.join(', ')
                            : 'Not specified'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <span className="flex items-center gap-1 text-primary-500">
                        {renderStars(previewCandidate.averageRating ?? 0)}
                      </span>
                      <span className="font-medium text-neutral-800">
                        {(previewCandidate.averageRating ?? 0).toFixed(1)}/5
                      </span>
                      <span>
                        • {previewCandidate.reviewCount ?? 0} review
                        {previewCandidate.reviewCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-neutral-600">
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                      <p className="uppercase tracking-wide text-neutral-400 mb-1">Part-time</p>
                      <p className="text-base font-semibold text-primary-600">
                        {previewCandidate.partTimeSalary} KD/hr
                      </p>
                    </div>
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                      <p className="uppercase tracking-wide text-neutral-400 mb-1">Full-time</p>
                      <p className="text-base font-semibold text-primary-600">
                        {previewCandidate.fullTimeSalary} KD/hr
                      </p>
                    </div>
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                      <p className="uppercase tracking-wide text-neutral-400 mb-1">Kuwait Exp.</p>
                      <p className="text-base font-semibold text-neutral-800">
                        {previewCandidate.kuwaitExperience} yrs
                      </p>
                    </div>
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                      <p className="uppercase tracking-wide text-neutral-400 mb-1">Total Exp.</p>
                      <p className="text-base font-semibold text-neutral-800">
                        {previewCandidate.totalExperience} yrs
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-2">About</h4>
                    <p className="text-sm text-neutral-600">
                      {previewCandidate.aboutMe || 'No description provided'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-neutral-400 mb-1">Skills</p>
                      <p className="text-sm text-neutral-700">
                        {previewCandidate.skills?.length
                          ? previewCandidate.skills.join(', ')
                          : 'Not specified'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-neutral-400 mb-1">Availability</p>
                      <p className="text-sm text-neutral-700">
                        {previewCandidate.availability?.length
                          ? previewCandidate.availability.join(', ')
                          : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-600">Unable to load candidate profile.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
