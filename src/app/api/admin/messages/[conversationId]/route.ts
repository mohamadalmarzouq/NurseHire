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

export async function GET(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const conversationId = decodeURIComponent(params.conversationId)
    const participantIds = conversationId.split('__')

    if (participantIds.length !== 2) {
      return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 })
    }

    const [userA, userB] = participantIds

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: userA,
            receiverId: userB,
          },
          {
            senderId: userB,
            receiverId: userA,
          },
        ],
      },
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
        createdAt: 'asc',
      },
    })

    if (!messages.length) {
      return NextResponse.json({
        conversation: {
          id: conversationId,
          participants: [],
          messages: [],
        },
      })
    }

    const participantsMap = new Map<string, any>()

    messages.forEach((message) => {
      if (!participantsMap.has(message.senderId)) {
        participantsMap.set(message.senderId, formatUser(message.sender))
      }
      if (!participantsMap.has(message.receiverId)) {
        participantsMap.set(message.receiverId, formatUser(message.receiver))
      }
    })

    const conversation = {
      id: conversationId,
      participants: Array.from(participantsMap.values()),
      messages: messages.map((message) => ({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        createdAt: message.createdAt,
        read: message.read,
        fileUrl: message.fileUrl,
        sender: formatUser(message.sender),
        receiver: formatUser(message.receiver),
      })),
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error fetching admin conversation detail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

