'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DailyIframe from '@daily-co/daily-js'

export default function CallPage() {
  const params = useParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(true)
  const [returnPath, setReturnPath] = useState('/user/calls')
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const callObjectRef = useRef<any>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data?.authenticated) {
            const role = data.user?.role
            if (role === 'CARETAKER') {
              setReturnPath('/caretaker/calls')
            } else {
              setReturnPath('/user/calls')
            }
          }
        }
      } catch (err) {
        console.error('Failed to load user:', err)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    const joinCall = async () => {
      try {
        const res = await fetch(`/api/calls/${params.id}/join`, { method: 'POST' })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to join call')
        }

        const callObject = DailyIframe.createCallObject()
        callObjectRef.current = callObject

        callObject.on('track-started', (event: any) => {
          const { participant, track } = event
          if (!track || track.kind !== 'video') return

          const mediaStream = new MediaStream([track])

          if (participant.local && localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStream
          } else if (!participant.local && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = mediaStream
          }
        })

        callObject.on('track-stopped', () => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null
          }
        })

        await callObject.join({ url: data.roomUrl, token: data.token })
        setIsJoining(false)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to join call')
      }
    }

    joinCall()

    return () => {
      const callObject = callObjectRef.current
      if (callObject) {
        callObject.leave()
        callObject.destroy()
      }
    }
  }, [params.id])

  const handleLeave = async () => {
    try {
      const callObject = callObjectRef.current
      if (callObject) {
        await callObject.leave()
        callObject.destroy()
      }
      await fetch(`/api/calls/${params.id}/end`, { method: 'POST' })
    } catch (err) {
      console.error('Error ending call:', err)
    } finally {
      router.push(returnPath)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border p-6 max-w-md text-center">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Unable to join call</h1>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div>
          <h1 className="text-lg font-semibold">Video Call</h1>
          {isJoining && <p className="text-sm text-gray-400">Joining...</p>}
        </div>
        <button
          onClick={handleLeave}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium"
        >
          End Call
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <div className="bg-black rounded-lg overflow-hidden aspect-video">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
        <div className="bg-black rounded-lg overflow-hidden aspect-video">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  )
}
