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

    const { id: candidateId } = await params
    const body = await request.json()
    const { action } = body // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Check if candidate exists and is pending
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      include: { candidateProfile: true }
    })

    if (!candidate || !candidate.candidateProfile) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    if (candidate.candidateProfile.status !== 'PENDING') {
      return NextResponse.json({ error: 'Candidate is not pending approval' }, { status: 400 })
    }

    // Update candidate status
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
    
    await prisma.candidateProfile.update({
      where: { userId: candidateId },
      data: { status: newStatus }
    })

    return NextResponse.json({
      success: true,
      message: `Candidate ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      candidate: {
        id: candidate.id,
        name: candidate.candidateProfile.name,
        email: candidate.email,
        status: newStatus
      }
    })
  } catch (error) {
    console.error('Error updating candidate status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
