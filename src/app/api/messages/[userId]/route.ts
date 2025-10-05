import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId: otherUserId } = await params

    // Get messages between current user and other user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: payload.id,
            receiverId: otherUserId,
          },
          {
            senderId: otherUserId,
            receiverId: payload.id,
          },
        ],
      },
      include: {
        sender: {
          include: {
            userProfile: true,
            nurseProfile: true,
          },
        },
        receiver: {
          include: {
            userProfile: true,
            nurseProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: payload.id,
        read: false,
      },
      data: {
        read: true,
      },
    })

    // Get other user info
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      include: {
        userProfile: true,
        nurseProfile: true,
      },
    })

    if (!otherUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      messages: messages.map(message => ({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        read: message.read,
        createdAt: message.createdAt,
        fileUrl: message.fileUrl,
        sender: {
          id: message.sender.id,
          name: message.sender.userProfile?.name || message.sender.nurseProfile?.name || 'Unknown',
          role: message.sender.role,
        },
        receiver: {
          id: message.receiver.id,
          name: message.receiver.userProfile?.name || message.receiver.nurseProfile?.name || 'Unknown',
          role: message.receiver.role,
        },
      })),
      otherUser: {
        id: otherUser.id,
        name: otherUser.userProfile?.name || otherUser.nurseProfile?.name || 'Unknown',
        role: otherUser.role,
        email: otherUser.email,
      },
    })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
