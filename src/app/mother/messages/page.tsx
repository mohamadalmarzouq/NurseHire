'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Send, Paperclip, Smile } from 'lucide-react'

export default function MotherMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock data - in real app, fetch from API
    setConversations([
      {
        id: 1,
        nurseName: 'Aisha Al-Rashid',
        nurseImage: '/uploads/sample-nurse.jpg',
        lastMessage: 'Thank you for choosing me! I\'m excited to help with your newborn.',
        lastMessageTime: '2024-09-30T14:30:00Z',
        unreadCount: 2,
        isOnline: true
      },
      {
        id: 2,
        nurseName: 'Fatima Hassan',
        nurseImage: '/uploads/sample-nurse2.jpg',
        lastMessage: 'I can start this weekend if that works for you.',
        lastMessageTime: '2024-09-29T16:45:00Z',
        unreadCount: 0,
        isOnline: false
      }
    ])
    setIsLoading(false)
  }, [])

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In real app, send message via API
      console.log('Sending message:', newMessage)
      setNewMessage('')
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
              <Link href="/" className="text-2xl font-bold text-primary-600">
                NurseHire
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/mother/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign In
              </Link>
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
                      key={conversation.id}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedConversation?.id === conversation.id ? 'bg-primary-50' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {conversation.nurseName.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          {conversation.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {conversation.nurseName}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {new Date(conversation.lastMessageTime).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conversation.lastMessage}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <div className="flex justify-end mt-1">
                              <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1">
                                {conversation.unreadCount}
                              </span>
                            </div>
                          )}
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
                          {selectedConversation.nurseName.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedConversation.nurseName}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedConversation.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <div className="bg-primary-600 text-white px-4 py-2 rounded-lg max-w-xs">
                          <p className="text-sm">Hi! I'm interested in booking you for newborn care.</p>
                          <p className="text-xs text-primary-200 mt-1">2:30 PM</p>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-white text-gray-900 px-4 py-2 rounded-lg max-w-xs shadow-sm">
                          <p className="text-sm">Hello! Thank you for your interest. I'd be happy to help with your newborn care needs.</p>
                          <p className="text-xs text-gray-500 mt-1">2:32 PM</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-primary-600 text-white px-4 py-2 rounded-lg max-w-xs">
                          <p className="text-sm">Great! What are your rates for weekend care?</p>
                          <p className="text-xs text-primary-200 mt-1">2:35 PM</p>
                        </div>
                      </div>
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
