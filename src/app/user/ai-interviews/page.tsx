'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bot, CheckCircle, Clock, Video } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { useLanguage } from '@/lib/language'

interface CandidateOption {
  id: string
  name: string
  totalExperience: number
  profileImageUrl?: string | null
  averageRating?: number | null
  reviewCount?: number | null
}

export default function UserAiInterviewsPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [candidates, setCandidates] = useState<CandidateOption[]>([])
  const [candidateSearch, setCandidateSearch] = useState('')
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([])
  const [interviews, setInterviews] = useState<any[]>([])
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
            totalExperience: candidate.totalExperience || 0,
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
        <div className="mb-8">
          <Link
            href="/user/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="nh-h1">{t('user.dashboard.aiInterviews')}</h1>
          <p className="nh-sub">{t('user.dashboard.aiInterviewsDesc')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <div className="nh-card">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">Create AI Interview</h2>
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Candidate
                  </label>
                  <div className="space-y-3">
                    <input
                      className="nh-input"
                      placeholder="Search candidates..."
                      value={candidateSearch}
                      onChange={(event) => setCandidateSearch(event.target.value)}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={allVisibleSelected}
                          onChange={toggleAllVisibleCandidates}
                        />
                        Select all visible
                      </label>
                      <span>{selectedCandidateIds.length} selected</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 rounded-md border border-gray-200 p-2">
                      {filteredCandidates.length === 0 ? (
                        <div className="text-sm text-gray-500 px-2 py-3">
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
                              className={`w-full rounded-md border px-3 py-2 text-left transition ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleCandidate(candidate.id)}
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-gray-900">
                                      {candidate.name}
                                    </span>
                                    {candidate.averageRating !== null && (
                                      <span className="text-xs text-gray-500">
                                        {candidate.averageRating.toFixed(1)}★ ({candidate.reviewCount ?? 0})
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {candidate.totalExperience} yrs experience
                                  </p>
                                </div>
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    className="nh-input"
                    value={formData.title}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, title: event.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description
                  </label>
                  <textarea
                    className="nh-input min-h-[110px]"
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, description: event.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requirements (optional)
                  </label>
                  <textarea
                    className="nh-input min-h-[80px]"
                    value={formData.requirements}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, requirements: event.target.value }))
                    }
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving || selectedCandidateIds.length === 0}
                  className="btn-primary w-full"
                >
                  {saving ? 'Creating...' : 'Create Interview'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="nh-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Interviews</h2>
              {interviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
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
                        className="rounded-lg border border-gray-200 p-4 flex flex-col gap-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">{interview.title}</h3>
                            <p className="text-sm text-gray-500">{candidateName}</p>
                          </div>
                          {renderStatus(interview.status)}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {interview.description}
                        </p>
                        <div className="flex items-center gap-3">
                          {session?.recordingUrl ? (
                            <a
                              href={session.recordingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                            >
                              <Video className="w-4 h-4 mr-1" />
                              Replay Interview
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">Recording not available yet</span>
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
      </div>
    </div>
  )
}
