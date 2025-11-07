'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardHeader from '@/components/DashboardHeader'
import { ArrowLeft, Loader2, MessageSquare, User, Mail, Users } from 'lucide-react'

interface Participant {
  id: string
  name: string
  email: string | null
  role: string
}

interface ConversationSummary {
  id: string
  participants: Participant[]
  lastMessage: string
  lastMessageTime: string
  messageCount: number
}

interface ConversationDetail {
  id: string
  participants: Participant[]
  messages: Array<{
    id: string
    content: string
    senderId: string
    receiverId: string
    createdAt: string
    read: boolean
    fileUrl?: string | null
    sender: Participant
    receiver: Participant
  }>
}

function formatRole(role: string) {
  if (!role) return 'Unknown'
  switch (role.toUpperCase()) {
    case 'NURSE':
      return 'Nurse'
    case 'USER':
    case 'MOTHER':
      return 'User'
    case 'ADMIN':
      return 'Admin'
    default:
      return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }
}

function formatTimestamp(timestamp: string) {
  try {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  } catch {
    return timestamp
  }
}

function getConversationTitle(participants: Participant[]) {
  if (!participants?.length) return 'Conversation'
  const names = participants.map((participant) => participant.name || 'Unknown')
  return names.join(' • ')
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    setLoadingConversations(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/messages', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error('Failed to load conversations')
      }
      const data = await res.json()
      const list: ConversationSummary[] = data.conversations || []
      setConversations(list)

      if (list.length > 0) {
        await loadConversationDetail(list[0].id)
      } else {
        setSelectedConversationId(null)
        setSelectedConversation(null)
      }
    } catch (err) {
      console.error('Error loading conversations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load conversations')
    } finally {
      setLoadingConversations(false)
    }
  }

  const loadConversationDetail = async (conversationId: string) => {
    setSelectedConversationId(conversationId)
    setLoadingMessages(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/messages/${encodeURIComponent(conversationId)}`, { cache: 'no-store' })
      if (!res.ok) {
        throw new Error('Failed to load conversation details')
      }

      const data = await res.json()
      setSelectedConversation(data.conversation || null)
    } catch (err) {
      console.error('Error loading conversation detail:', err)
      setError(err instanceof Error ? err.message : 'Failed to load conversation details')
      setSelectedConversation(null)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSelectConversation = async (conversationId: string) => {
    if (conversationId === selectedConversationId) return
    await loadConversationDetail(conversationId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Messages</h1>
          <p className="text-gray-600 max-w-2xl">
            Review all conversations that take place between users and nurses. Messages are read-only; use this view to monitor discussions and ensure communication standards are met.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
              </div>
              {loadingConversations && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
            </div>

            {conversations.length === 0 && !loadingConversations ? (
              <div className="p-6 text-center text-gray-500">
                <p className="font-medium mb-1">No conversations yet</p>
                <p className="text-sm">Messages between users and nurses will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {conversations.map((conversation) => {
                  const isActive = conversation.id === selectedConversationId
                  const primaryParticipant = conversation.participants[0]
                  const secondaryParticipant = conversation.participants[1]

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation.id)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {getConversationTitle(conversation.participants)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {primaryParticipant ? formatRole(primaryParticipant.role) : 'Participant'}
                            {secondaryParticipant ? ` • ${formatRole(secondaryParticipant.role)}` : ''}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatTimestamp(conversation.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {conversation.lastMessage || 'No message content'}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">{conversation.messageCount} message{conversation.messageCount === 1 ? '' : 's'}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 min-h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedConversation ? getConversationTitle(selectedConversation.participants) : 'Select a conversation'}
                </h2>
                {selectedConversation && (
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-2">
                    {selectedConversation.participants.map((participant) => (
                      <div key={participant.id} className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-700">{participant.name}</span>
                        <span className="text-gray-400">({formatRole(participant.role)})</span>
                        {participant.email && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Mail className="w-3 h-3" />
                            {participant.email}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {loadingMessages && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {!selectedConversation && !loadingMessages && (
                <div className="h-full flex items-center justify-center text-center text-gray-500">
                  <div>
                    <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="font-medium">Select a conversation to view messages</p>
                    <p className="text-sm">Choose a conversation from the list to review its messages.</p>
                  </div>
                </div>
              )}

              {loadingMessages && (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    Loading messages...
                  </div>
                </div>
              )}

              {!loadingMessages && selectedConversation && selectedConversation.messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="font-medium">No messages yet</p>
                    <p className="text-sm">Messages exchanged between participants will appear here.</p>
                  </div>
                </div>
              )}

              {!loadingMessages && selectedConversation && selectedConversation.messages.length > 0 && (
                <div className="space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div key={message.id} className="flex flex-col">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="font-medium text-gray-700">{message.sender?.name || 'Unknown'}</span>
                        <span className="text-gray-400">• {formatRole(message.sender?.role)}</span>
                        <span className="text-gray-400">• {formatTimestamp(message.createdAt)}</span>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <p className="text-gray-800 whitespace-pre-wrap break-words">{message.content}</p>
                        {message.fileUrl && (
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                          >
                            View attachment
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

