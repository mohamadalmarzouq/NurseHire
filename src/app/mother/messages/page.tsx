'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Send, Paperclip, Smile } from 'lucide-react'

export default function MotherMessagesPage() {
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600 no-underline">
                ENFAS
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/mother/dashboard" className="text-gray-600 hover:text-gray-900">
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
        {/* Page Header */}
        <div className="mb-8">
          <Link href="/mother/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">Chat with your nurses</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="flex h-[600px]">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
              </div>
              <div className="overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No conversations yet</p>
                    <p className="text-sm">Start by booking a nurse</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.partnerId}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedConversation?.partnerId === conversation.partnerId ? 'bg-primary-50' : ''
                      }`}
                      onClick={() => loadConversation(conversation)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {conversation.partnerName.split(' ').map((n: string) => n[0]).join('')}
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
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {conversation.partnerName}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {new Date(conversation.lastMessageTime).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {selectedConversation.partnerName.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedConversation.partnerName}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedConversation.partnerRole === 'NURSE' ? 'Nurse' : 'Mother'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    <div className="space-y-3">
                      {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                        selectedConversation.messages.map((message: any, index: number) => {
                          const isMe = message.senderId === user?.id
                          const showSender = index === 0 || selectedConversation.messages[index - 1].senderId !== message.senderId
                          
                          return (
                            <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-md ${isMe ? 'ml-12' : 'mr-12'}`}>
                                {showSender && !isMe && (
                                  <div className="flex items-center space-x-2 mb-1">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-medium text-blue-600">
                                        {selectedConversation.partnerName.charAt(0)}
                                      </span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-600">
                                      {selectedConversation.partnerName}
                                    </span>
                                  </div>
                                )}
                                {showSender && isMe && (
                                  <div className="flex items-center justify-end space-x-2 mb-1">
                                    <span className="text-xs font-medium text-gray-600">You</span>
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-medium text-green-600">Y</span>
                                    </div>
                                  </div>
                                )}
                                <div className={`px-4 py-3 rounded-2xl ${
                                  isMe 
                                    ? 'bg-blue-500 text-white rounded-br-md' 
                                    : 'bg-white text-gray-900 shadow-sm rounded-bl-md border'
                                }`}>
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
                        })
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-500 hover:text-gray-700 p-2">
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button className="text-gray-500 hover:text-gray-700 p-2">
                        <Smile className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleSendMessage}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm">Choose a nurse to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
