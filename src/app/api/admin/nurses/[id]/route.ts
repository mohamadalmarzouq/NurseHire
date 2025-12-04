import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: caretakerId } = await params
    const body = await request.json()
    const { action } = body // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Check if care taker exists and is pending
    const caretaker = await prisma.user.findUnique({
      where: { id: caretakerId },
      include: { caretakerProfile: true }
    })

    if (!caretaker || !caretaker.caretakerProfile) {
      return NextResponse.json({ error: 'Care taker not found' }, { status: 404 })
    }

    if (caretaker.caretakerProfile.status !== 'PENDING') {
      return NextResponse.json({ error: 'Care taker is not pending approval' }, { status: 400 })
    }

    // Update care taker status
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
    
    await prisma.careTakerProfile.update({
      where: { userId: caretakerId },
      data: { status: newStatus }
    })

    return NextResponse.json({
      success: true,
      message: `Care taker ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      caretaker: {
        id: caretaker.id,
        name: caretaker.caretakerProfile.name,
        email: caretaker.email,
        status: newStatus
      }
    })
  } catch (error) {
    console.error('Error updating care taker status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
