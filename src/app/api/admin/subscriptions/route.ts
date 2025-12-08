import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { activateSubscription, deactivateSubscription, checkAndExpireSubscriptions } from '@/lib/subscription'

// GET /api/admin/subscriptions - List all user subscriptions
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check and expire outdated subscriptions first
    await checkAndExpireSubscriptions()

    // Get all users with their subscription info
    const users = await prisma.user.findMany({
      where: {
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        subscriptionAmount: true,
        userProfile: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        subscriptionStartDate: 'desc',
      },
    })

    const subscriptions = users.map(user => ({
      userId: user.id,
      email: user.email,
      name: user.userProfile?.name || 'N/A',
      status: user.subscriptionStatus,
      startDate: user.subscriptionStartDate,
      endDate: user.subscriptionEndDate,
      amount: user.subscriptionAmount ? Number(user.subscriptionAmount) : null,
    }))

    // Count statistics
    const stats = {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.status === 'ACTIVE').length,
      expired: subscriptions.filter(s => s.status === 'EXPIRED').length,
      none: subscriptions.filter(s => s.status === 'NONE').length,
    }

    return NextResponse.json({
      subscriptions,
      stats,
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/subscriptions - Activate or deactivate a subscription
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, action, amount } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      )
    }

    if (action === 'activate') {
      const subscriptionAmount = amount || 15.0
      await activateSubscription(userId, subscriptionAmount)
      return NextResponse.json({
        success: true,
        message: 'Subscription activated successfully',
      })
    } else if (action === 'deactivate') {
      await deactivateSubscription(userId)
      return NextResponse.json({
        success: true,
        message: 'Subscription deactivated successfully',
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "activate" or "deactivate"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error managing subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

