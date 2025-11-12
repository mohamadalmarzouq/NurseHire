'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Send, Paperclip, Smile, Search, Users, Sparkles } from 'lucide-react'

export default function MotherMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [filteredConversations, setFilteredConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

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
          setFilteredConversations(data.conversations || [])
        }
      } catch (e) {
        console.error('Error loading conversations:', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadConversations()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredConversations(conversations)
    } else {
      const filtered = conversations.filter(conv =>
        conv.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredConversations(filtered)
    }
  }, [searchTerm, conversations])

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
            setFilteredConversations(data.conversations || [])
            
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
          <Link href="/mother/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600 mt-2">Chat with your nurses and stay connected</p>
            </div>
            {conversations.length > 0 && (
              <Link 
                href="/nurses" 
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Users className="w-4 h-4 mr-2" />
                Find Nurses
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex h-[650px]">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Conversations</h2>
                {conversations.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-10 h-10 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                    <p className="text-gray-600 text-sm mb-6">Start chatting with nurses by booking one first</p>
                    <Link 
                      href="/nurses"
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Browse Nurses
                    </Link>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">No conversations found</p>
                    <p className="text-gray-500 text-xs mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {filteredConversations.map((conversation) => (
                      <button
                        key={conversation.partnerId}
                        type="button"
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                          selectedConversation?.partnerId === conversation.partnerId 
                            ? 'bg-primary-600 border-primary-600 shadow-md transform scale-[1.02]' 
                            : 'bg-white border-gray-200 hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm active:scale-[0.98]'
                        }`}
                        onClick={() => loadConversation(conversation)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm ${
                              selectedConversation?.partnerId === conversation.partnerId
                                ? 'bg-white text-primary-600'
                                : 'bg-gradient-to-br from-primary-100 to-secondary-100 text-primary-700'
                            }`}>
                              {conversation.partnerName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedConversation?.partnerId === conversation.partnerId
                                  ? 'bg-white border-primary-600'
                                  : 'bg-red-500 border-white'
                              }`}>
                                <span className={`text-xs font-bold ${
                                  selectedConversation?.partnerId === conversation.partnerId
                                    ? 'text-red-500'
                                    : 'text-white'
                                }`}>
                                  {conversation.unreadCount}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className={`text-sm font-semibold truncate ${
                                selectedConversation?.partnerId === conversation.partnerId
                                  ? 'text-white'
                                  : 'text-gray-900'
                              }`}>
                                {conversation.partnerName}
                              </h3>
                              <span className={`text-xs flex-shrink-0 ml-2 ${
                                selectedConversation?.partnerId === conversation.partnerId
                                  ? 'text-primary-100'
                                  : 'text-gray-500'
                              }`}>
                                {formatRelativeTime(conversation.lastMessageTime)}
                              </span>
                            </div>
                            <p className={`text-sm truncate ${
                              selectedConversation?.partnerId === conversation.partnerId
                                ? 'text-primary-100'
                                : conversation.unreadCount > 0
                                  ? 'text-gray-900 font-medium'
                                  : 'text-gray-600'
                            }`}>
                              {conversation.lastMessage || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center font-semibold text-primary-700">
                        {selectedConversation.partnerName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{selectedConversation.partnerName}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedConversation.partnerRole === 'NURSE' ? 'Professional Nurse' : 'Mother'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                    <div className="space-y-4">
                      {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                        selectedConversation.messages.map((message: any, index: number) => {
                          const isMe = message.senderId === user?.id
                          const showSender = index === 0 || selectedConversation.messages[index - 1].senderId !== message.senderId
                          
                          return (
                            <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-md ${isMe ? 'ml-12' : 'mr-12'}`}>
                                {showSender && !isMe && (
                                  <div className="flex items-center space-x-2 mb-1">
                                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-semibold text-primary-700">
                                        {selectedConversation.partnerName.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-700">
                                      {selectedConversation.partnerName}
                                    </span>
                                  </div>
                                )}
                                {showSender && isMe && (
                                  <div className="flex items-center justify-end space-x-2 mb-1">
                                    <span className="text-xs font-medium text-gray-700">You</span>
                                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-semibold text-white">Y</span>
                                    </div>
                                  </div>
                                )}
                                <div className={`px-4 py-3 rounded-2xl shadow-md ${
                                  isMe 
                                    ? 'bg-primary-600 text-white rounded-br-md' 
                                    : 'bg-white text-gray-900 rounded-bl-md border-2 border-gray-200'
                                }`}>
                                  <p className={`text-sm leading-relaxed font-medium ${
                                    isMe ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {message.content}
                                  </p>
                                  <p className={`text-xs mt-2 font-normal ${
                                    isMe ? 'text-primary-100' : 'text-gray-500'
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
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-primary-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Start the conversation!</h3>
                          <p className="text-gray-600 text-sm">Send a message to begin chatting with {selectedConversation.partnerName}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-500 hover:text-primary-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button className="text-gray-500 hover:text-primary-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <Smile className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50">
                  <div className="text-center max-w-md px-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageCircle className="w-12 h-12 text-primary-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Messages</h3>
                    <p className="text-gray-600 mb-6">
                      Select a conversation from the left to start chatting, or browse nurses to begin a new conversation.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link 
                        href="/nurses"
                        className="inline-flex items-center justify-center px-5 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Users className="w-5 h-5 mr-2" />
                        Browse Nurses
                      </Link>
                      <Link 
                        href="/mother/dashboard"
                        className="inline-flex items-center justify-center px-5 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Go to Dashboard
                      </Link>
                    </div>
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
