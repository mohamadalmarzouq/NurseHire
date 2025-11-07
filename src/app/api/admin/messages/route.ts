import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function formatUser(user: any) {
  const name = user?.userProfile?.name || user?.nurseProfile?.name || user?.adminProfile?.name || user?.name || user?.email || 'Unknown'

  return {
    id: user?.id,
    name,
    email: user?.email || null,
    role: user?.role || 'UNKNOWN',
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      include: {
        sender: {
          include: {
            userProfile: true,
            nurseProfile: true,
            adminProfile: true,
          },
        },
        receiver: {
          include: {
            userProfile: true,
            nurseProfile: true,
            adminProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const conversationMap = new Map<string, any>()

    messages.forEach((message) => {
      const participantIds = [message.senderId, message.receiverId].sort()
      const conversationId = participantIds.join('__')

      if (!conversationMap.has(conversationId)) {
        conversationMap.set(conversationId, {
          id: conversationId,
          participants: [formatUser(message.sender), formatUser(message.receiver)],
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          messageCount: 0,
        })
      }

      const conversation = conversationMap.get(conversationId)
      conversation.messageCount += 1

      if (new Date(message.createdAt).getTime() > new Date(conversation.lastMessageTime).getTime()) {
        conversation.lastMessage = message.content
        conversation.lastMessageTime = message.createdAt
      }
    })

    const conversations = Array.from(conversationMap.values()).sort((a, b) => {
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching admin conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

