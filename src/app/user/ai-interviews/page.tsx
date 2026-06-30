'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bot, CheckCircle, Clock, Video } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { useLanguage } from '@/lib/language'

interface CandidateOption {
  id: string
  name: string
}

export default function UserAiInterviewsPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [candidates, setCandidates] = useState<CandidateOption[]>([])
  const [interviews, setInterviews] = useState<any[]>([])
  const [questionsFile, setQuestionsFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    candidateId: '',
    title: '',
    description: '',
    requirements: '',
    questionsText: '',
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
    setSaving(true)
    try {
      const payload = new FormData()
      payload.append('candidateId', formData.candidateId)
      payload.append('title', formData.title)
      payload.append('description', formData.description)
      payload.append('requirements', formData.requirements)
      if (formData.questionsText.trim()) {
        payload.append('questionsText', formData.questionsText.trim())
      }
      if (questionsFile) {
        payload.append('questionsFile', questionsFile, questionsFile.name)
      }

      const res = await fetch('/api/ai-interviews', {
        method: 'POST',
        body: payload,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        alert(data?.error || 'Failed to create interview')
        return
      }

      setFormData({
        candidateId: '',
        title: '',
        description: '',
        requirements: '',
        questionsText: '',
      })
      setQuestionsFile(null)
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
                  <select
                    className="nh-input"
                    value={formData.candidateId}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, candidateId: event.target.value }))
                    }
                    required
                  >
                    <option value="">Select candidate</option>
                    {candidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </option>
                    ))}
                  </select>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interview Questions (optional)
                  </label>
                  <textarea
                    className="nh-input min-h-[120px]"
                    placeholder="Type interview questions or paste a list. (Optional)"
                    value={formData.questionsText}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, questionsText: event.target.value }))
                    }
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    You can also upload a file instead of typing questions.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Questions File (optional)
                  </label>
                  <input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={(event) =>
                      setQuestionsFile(event.target.files?.[0] || null)
                    }
                    className="block w-full text-sm text-gray-700"
                  />
                  {questionsFile && (
                    <p className="text-xs text-gray-500 mt-1">Selected: {questionsFile.name}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={saving}
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
