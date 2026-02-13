'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DailyIframe from '@daily-co/daily-js'

type ParticipantInfo = {
  id: string
  name: string
  local: boolean
}

type ChatMessage = {
  id: string
  sender: string
  text: string
  timestamp: string
}

export default function CallPage() {
  const params = useParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(true)
  const [returnPath, setReturnPath] = useState('/user/calls')
  const [hasRemote, setHasRemote] = useState(false)
  const [participants, setParticipants] = useState<ParticipantInfo[]>([])
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
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

        const refreshParticipants = () => {
          const participantMap = callObject.participants()
          const list = Object.values(participantMap).map((participant: any) => ({
            id: participant.session_id,
            name: participant.user_name || (participant.local ? 'You' : 'Participant'),
            local: !!participant.local,
          }))
          setParticipants(list)
        }

        callObject.on('participant-joined', refreshParticipants)
        callObject.on('participant-left', (event: any) => {
          if (!event?.participant?.local) {
            setHasRemote(false)
          }
          refreshParticipants()
        })

        callObject.on('app-message', (event: any) => {
          if (!event?.data?.text) return
          const sender = event?.from?.user_name || 'Participant'
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              sender,
              text: String(event.data.text),
              timestamp: new Date().toLocaleTimeString(),
            },
          ])
        })

        callObject.on('track-started', (event: any) => {
          const { participant, track } = event
          if (!track || track.kind !== 'video') return

          const mediaStream = new MediaStream([track])

          if (participant.local && localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStream
          } else if (!participant.local && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = mediaStream
            setHasRemote(true)
          }
        })

        callObject.on('track-stopped', (event: any) => {
          if (!event?.participant?.local && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null
            setHasRemote(false)
          }
        })

        callObject.on('participant-left', (event: any) => {
          if (!event?.participant?.local) {
            setHasRemote(false)
          }
        })

        refreshParticipants()

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

  const sendMessage = () => {
    const text = chatInput.trim()
    if (!text) return
    const callObject = callObjectRef.current
    if (callObject) {
      callObject.sendAppMessage({ text }, '*')
    }
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        sender: 'You',
        text,
        timestamp: new Date().toLocaleTimeString(),
      },
    ])
    setChatInput('')
  }

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsChatOpen((prev) => !prev)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-sm font-medium"
          >
            {isChatOpen ? 'Hide Chat' : 'Show Chat'}
          </button>
          <button
            onClick={handleLeave}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium"
          >
            End Call
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black rounded-lg overflow-hidden aspect-video">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          <div className="bg-black rounded-lg overflow-hidden aspect-video">
            <div className="relative w-full h-full">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              {!hasRemote && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-gray-200">
                  Waiting for the other participant to join...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`bg-gray-800 rounded-lg p-4 flex flex-col gap-4 ${isChatOpen ? '' : 'hidden lg:block'}`}>
          <div>
            <h2 className="text-sm font-semibold text-gray-200 mb-2">Participants</h2>
            <div className="space-y-2">
              {participants.length === 0 ? (
                <p className="text-xs text-gray-400">No participants yet</p>
              ) : (
                participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between text-sm text-gray-200"
                  >
                    <span>{participant.name}</span>
                    {participant.local && (
                      <span className="text-xs text-green-400">You</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <h2 className="text-sm font-semibold text-gray-200 mb-2">Chat</h2>
            <div className="flex-1 overflow-y-auto space-y-3 bg-gray-900 rounded-md p-3">
              {messages.length === 0 ? (
                <p className="text-xs text-gray-400">No messages yet</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="text-xs text-gray-200">
                    <div className="flex items-center justify-between text-gray-400 mb-1">
                      <span>{message.sender}</span>
                      <span>{message.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-100">{message.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />
              <button
                onClick={sendMessage}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
