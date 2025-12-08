'use client'

import Link from 'next/link'
import { Lock, MessageCircle, Phone } from 'lucide-react'

interface SubscriptionPromptProps {
  type: 'phone' | 'message' | 'both'
  className?: string
}

export default function SubscriptionPrompt({ type, className = '' }: SubscriptionPromptProps) {
  const getContent = () => {
    if (type === 'phone') {
      return {
        icon: Phone,
        title: 'Subscribe to View Phone Number',
        description: 'Get access to care taker contact information with a monthly subscription.',
        buttonText: 'Subscribe Now',
      }
    } else if (type === 'message') {
      return {
        icon: MessageCircle,
        title: 'Subscribe to Send Messages',
        description: 'Start conversations with care takers by subscribing to our premium service.',
        buttonText: 'Subscribe Now',
      }
    } else {
      return {
        icon: Lock,
        title: 'Subscribe to Unlock Features',
        description: 'Subscribe to view phone numbers and send messages to care takers.',
        buttonText: 'Subscribe Now',
      }
    }
  }

  const content = getContent()
  const Icon = content.icon

  return (
    <div className={`bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            {content.title}
          </h3>
          <p className="text-neutral-600 mb-4">
            {content.description}
          </p>
          <Link
            href="/user/subscription"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            {content.buttonText}
          </Link>
        </div>
      </div>
    </div>
  )
}

