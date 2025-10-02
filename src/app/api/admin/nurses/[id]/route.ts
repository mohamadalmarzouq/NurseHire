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

    const { id: nurseId } = await params
    const body = await request.json()
    const { action } = body // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Check if nurse exists and is pending
    const nurse = await prisma.user.findUnique({
      where: { id: nurseId },
      include: { nurseProfile: true }
    })

    if (!nurse || !nurse.nurseProfile) {
      return NextResponse.json({ error: 'Nurse not found' }, { status: 404 })
    }

    if (nurse.nurseProfile.status !== 'PENDING') {
      return NextResponse.json({ error: 'Nurse is not pending approval' }, { status: 400 })
    }

    // Update nurse status
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
    
    await prisma.nurseProfile.update({
      where: { userId: nurseId },
      data: { status: newStatus }
    })

    return NextResponse.json({
      success: true,
      message: `Nurse ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      nurse: {
        id: nurse.id,
        name: nurse.nurseProfile.name,
        email: nurse.email,
        status: newStatus
      }
    })
  } catch (error) {
    console.error('Error updating nurse status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
