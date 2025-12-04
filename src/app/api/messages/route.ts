import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get conversations for the current user
    const conversations = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: payload.id },
          { receiverId: payload.id },
        ],
      },
      include: {
        sender: {
          include: {
            userProfile: true,
            caretakerProfile: true,
          },
        },
        receiver: {
          include: {
            userProfile: true,
            caretakerProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Group messages by conversation partner
    const conversationMap = new Map()
    
    conversations.forEach(message => {
      const partnerId = message.senderId === payload.id ? message.receiverId : message.senderId
      const partner = message.senderId === payload.id ? message.receiver : message.sender
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          partnerName: partner.userProfile?.name || partner.caretakerProfile?.name || 'Unknown',
          partnerRole: partner.role,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: 0,
          messages: [],
        })
      }
      
      const conversation = conversationMap.get(partnerId)
      conversation.messages.push({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        read: message.read,
        createdAt: message.createdAt,
        fileUrl: message.fileUrl,
      })
      
      // Count unread messages
      if (message.receiverId === payload.id && !message.read) {
        conversation.unreadCount++
      }
    })

    // Convert to array and sort by last message time
    const conversationList = Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    )

    return NextResponse.json({
      conversations: conversationList,
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { receiverId, content, fileUrl } = body

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Receiver ID and content are required' }, { status: 400 })
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    })

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: payload.id,
        receiverId,
        content,
        fileUrl,
      },
      include: {
        sender: {
          include: {
            userProfile: true,
            caretakerProfile: true,
          },
        },
        receiver: {
          include: {
            userProfile: true,
            caretakerProfile: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        read: message.read,
        createdAt: message.createdAt,
        fileUrl: message.fileUrl,
        sender: {
          id: message.sender.id,
          name: message.sender.userProfile?.name || message.sender.caretakerProfile?.name || 'Unknown',
          role: message.sender.role,
        },
        receiver: {
          id: message.receiver.id,
          name: message.receiver.userProfile?.name || message.receiver.caretakerProfile?.name || 'Unknown',
          role: message.receiver.role,
        },
      },
    })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
