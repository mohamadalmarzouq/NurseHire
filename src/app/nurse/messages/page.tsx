'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Send } from 'lucide-react'

export default function NurseMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!res.ok) {
          window.location.href = '/auth/login'
          return
        }
        const data = await res.json()
        if (data?.authenticated) setUser(data.user)
      } catch (e) {
        console.error(e)
        window.location.href = '/auth/login'
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await fetch('/api/messages', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setConversations(data.conversations || [])
        }
      } catch (e) {
        console.error('Error loading conversations:', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadConversations()
  }, [])

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedConversation) {
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            receiverId: selectedConversation.partnerId,
            content: newMessage,
          }),
        })

        if (res.ok) {
          // Reload conversations to get updated messages
          const conversationsRes = await fetch('/api/messages', { cache: 'no-store' })
          if (conversationsRes.ok) {
            const data = await conversationsRes.json()
            setConversations(data.conversations || [])
            
            // Update selected conversation
            const updatedConv = data.conversations.find((c: any) => c.partnerId === selectedConversation.partnerId)
            if (updatedConv) {
              setSelectedConversation(updatedConv)
            }
          }
          setNewMessage('')
        }
      } catch (e) {
        console.error('Error sending message:', e)
      }
    }
  }

  const loadConversation = async (conversation: any) => {
    try {
      const res = await fetch(`/api/messages/${conversation.partnerId}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setSelectedConversation({
          ...conversation,
          messages: data.messages || [],
          otherUser: data.otherUser,
        })
      }
    } catch (e) {
      console.error('Error loading conversation:', e)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              NurseHire
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/nurse/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <button 
                onClick={() => {
                  document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
                  window.location.href = '/auth/login'
                }}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/nurse/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="nh-h2">Messages</h1>
          <p className="nh-sub mt-1">Chat with users</p>
        </div>

        <div className="nh-card overflow-hidden">
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-600">When users contact you, messages will appear here</p>
            </div>
          ) : (
            <div className="flex h-96">
              {/* Conversations List */}
              <div className="w-1/3 border-r border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">Conversations</h3>
                </div>
                <div className="overflow-y-auto">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.partnerId}
                      onClick={() => loadConversation(conversation)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.partnerId === conversation.partnerId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-medium text-sm">
                              {conversation.partnerName?.charAt(0) || 'M'}
                            </span>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                              <span className="text-xs text-white font-bold">{conversation.unreadCount}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.partnerName || 'User'}
                            </p>
                            <span className="text-xs text-gray-500">
                              {conversation.lastMessageTime ? new Date(conversation.lastMessageTime).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {conversation.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <h3 className="font-medium text-gray-900">
                        {selectedConversation.otherUser?.name || selectedConversation.partnerName || 'User'}
                      </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {selectedConversation.messages?.map((message: any, index: number) => {
                        const isMe = message.senderId === user?.id
                        const showSender = index === 0 || selectedConversation.messages[index - 1].senderId !== message.senderId
                        
                        return (
                          <div
                            key={index}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-md ${isMe ? 'ml-12' : 'mr-12'}`}>
                              {showSender && !isMe && (
                                <div className="flex items-center space-x-2 mb-1">
                                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-green-600">
                                      {selectedConversation.otherUser?.name?.charAt(0) || 'M'}
                                    </span>
                                  </div>
                                  <span className="text-xs font-medium text-gray-600">
                                    {selectedConversation.otherUser?.name || 'User'}
                                  </span>
                                </div>
                              )}
                              {showSender && isMe && (
                                <div className="flex items-center justify-end space-x-2 mb-1">
                                  <span className="text-xs font-medium text-gray-600">You</span>
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-blue-600">N</span>
                                  </div>
                                </div>
                              )}
                              <div
                                className={`px-4 py-3 rounded-2xl ${
                                  isMe
                                    ? 'bg-blue-500 text-white rounded-br-md'
                                    : 'bg-white text-gray-900 shadow-sm rounded-bl-md border'
                                }`}
                              >
                                <p className="text-sm leading-relaxed">{message.content}</p>
                                <p className={`text-xs mt-2 ${
                                  isMe ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {new Date(message.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 nh-input"
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className="nh-btn nh-btn--primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Select a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
