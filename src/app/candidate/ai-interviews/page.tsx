'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bot, CheckCircle, Clock } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

export default function CandidateAiInterviewsPage() {
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [ending, setEnding] = useState(false)
  const [interviews, setInterviews] = useState<any[]>([])
  const [activeInterviewId, setActiveInterviewId] = useState<string | null>(null)
  const [transcriptItems, setTranscriptItems] = useState<
    { id: string; role: 'agent' | 'candidate'; text: string }[]
  >([])
  const conversationRef = useRef<any | null>(null)
  const conversationIdRef = useRef<string | null>(null)
  const transcriptRef = useRef<string>('')

  const loadInterviews = async () => {
    try {
      const res = await fetch('/api/ai-interviews/assigned', { cache: 'no-store' })
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
    loadInterviews()
  }, [])

  const handleStart = async (interviewId: string) => {
    if (activeInterviewId && activeInterviewId !== interviewId) {
      alert('Finish the current interview before starting another one.')
      return
    }

    setStarting(interviewId)
    try {
      const res = await fetch(`/api/ai-interviews/${interviewId}/start`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const errorMessage =
          typeof data?.error === 'string'
            ? data.error
            : data?.error?.message || 'Unable to start interview'
        alert(errorMessage)
        return
      }

      const signedUrlRes = await fetch('/api/elevenlabs/signed-url')
      if (!signedUrlRes.ok) {
        const data = await signedUrlRes.json().catch(() => null)
        const errorMessage =
          typeof data?.error === 'string'
            ? data.error
            : data?.error?.message || 'Unable to start ElevenLabs session'
        alert(errorMessage)
        return
      }

      const { signedUrl } = await signedUrlRes.json()

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (error) {
        console.error('Microphone permission denied:', error)
        alert('Microphone access is required to start the interview.')
        return
      }

      const { Conversation } = await import('@elevenlabs/client')
      transcriptRef.current = ''
      setTranscriptItems([])

      conversationRef.current = await Conversation.startSession({
        signedUrl,
        connectionType: 'websocket',
        onMessage: (message: any) => {
          const text =
            typeof message === 'string' ? message : typeof message?.text === 'string' ? message.text : null
          const role =
            typeof message?.role === 'string'
              ? message.role
              : typeof message?.speaker === 'string'
                ? message.speaker
                : typeof message?.from === 'string'
                  ? message.from
                  : null
          if (text) {
            transcriptRef.current = transcriptRef.current
              ? `${transcriptRef.current}\n${text}`
              : text
            setTranscriptItems((prev) => [
              ...prev,
              {
                id: `${Date.now()}-${prev.length}`,
                role: role === 'assistant' || role === 'agent' ? 'agent' : 'candidate',
                text,
              },
            ])
          }
        },
      })

      conversationIdRef.current = conversationRef.current?.getId?.() || null
      setActiveInterviewId(interviewId)
      await loadInterviews()
    } catch (error) {
      console.error('Error starting interview:', error)
      alert('Unable to start interview')
    } finally {
      setStarting(null)
    }
  }

  const handleEnd = async () => {
    if (!activeInterviewId || !conversationRef.current) {
      return
    }

    setEnding(true)
    try {
      await conversationRef.current.endSession()
      conversationRef.current = null

      const finalizeRes = await fetch(`/api/ai-interviews/${activeInterviewId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptRef.current || null,
          conversationId: conversationIdRef.current,
        }),
      })

      if (!finalizeRes.ok) {
        const data = await finalizeRes.json().catch(() => null)
        throw new Error(data?.error || 'Unable to complete interview')
      }

      const finalizeData = await finalizeRes.json().catch(() => null)
      if (finalizeData?.recordingError) {
        console.warn('Recording upload issue:', finalizeData.recordingError)
      }

      transcriptRef.current = ''
      setTranscriptItems([])
      conversationIdRef.current = null
      setActiveInterviewId(null)
      await loadInterviews()
    } catch (error) {
      console.error('Error ending interview:', error)
      alert('Unable to complete interview')
    } finally {
      setEnding(false)
    }
  }

  const renderStatus = (interview: any) => {
    const sessionStatus = interview.sessions?.[0]?.status
    const status = sessionStatus || interview.status
    if (status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          Completed
        </span>
      )
    }
    if (status === 'RUNNING' || status === 'IN_PROGRESS') {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading AI interviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/candidate/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2 mb-6">
          <Bot className="w-6 h-6 text-primary-600" />
          <div>
            <h1 className="nh-h1">AI Interviews</h1>
            <p className="nh-sub">Complete interviews assigned to you.</p>
          </div>
        </div>

        {interviews.length === 0 ? (
          <div className="nh-card text-center py-10">
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Interviews Yet</h3>
            <p className="text-gray-600">When a user assigns you an AI interview, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => {
              const session = interview.sessions?.[0]
              const alreadyCompleted = session?.status === 'COMPLETED'
              const canResume = session?.status === 'IN_PROGRESS'
              const isActive = activeInterviewId === interview.id
              const ownerName = interview.user?.userProfile?.name || 'User'
              return (
                <div key={interview.id} className="nh-card">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{interview.title}</h3>
                      <p className="text-sm text-gray-500">Requested by {ownerName}</p>
                    </div>
                    {renderStatus(interview)}
                  </div>
                  <p className="text-sm text-gray-600 mt-3">{interview.description}</p>
                  {interview.requirements && (
                    <p className="text-sm text-gray-500 mt-2">
                      <span className="font-medium text-gray-700">Requirements:</span> {interview.requirements}
                    </p>
                  )}
                  <div className="mt-4">
                    {isActive ? (
                      <button className="btn-primary" onClick={handleEnd} disabled={ending}>
                        {ending ? 'Finishing...' : 'End Interview'}
                      </button>
                    ) : (
                      <button
                        className="btn-primary"
                        disabled={alreadyCompleted || starting === interview.id}
                        onClick={() => handleStart(interview.id)}
                      >
                        {alreadyCompleted
                          ? 'Interview Completed'
                          : canResume
                            ? 'Resume Interview'
                          : starting === interview.id
                            ? 'Starting...'
                            : 'Start Interview'}
                      </button>
                    )}
                    {alreadyCompleted && !isActive && (
                      <p className="text-xs text-gray-500 mt-2">
                        This interview can only be completed once.
                      </p>
                    )}
                    {isActive && (
                      <p className="text-xs text-gray-500 mt-2">Interview in progress. Speak to the AI agent.</p>
                    )}
                  </div>
                  {isActive && (
                    <div className="mt-4 border border-gray-100 rounded-lg bg-white">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-700">Live Transcript</p>
                        <p className="text-xs text-gray-500">Use this to confirm your mic is working.</p>
                      </div>
                      <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-3">
                        {transcriptItems.length === 0 ? (
                          <p className="text-sm text-gray-500">Waiting for the first response...</p>
                        ) : (
                          transcriptItems.map((item) => (
                            <div key={item.id} className="text-sm text-gray-700">
                              <span className="font-semibold">
                                {item.role === 'agent' ? 'AI' : 'You'}:
                              </span>{' '}
                              {item.text}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
