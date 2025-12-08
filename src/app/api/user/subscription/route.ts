import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getSubscriptionDetails, checkAndExpireSubscriptions } from '@/lib/subscription'

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

    // Only users can check their subscription
    if (payload.role !== 'USER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check and expire any outdated subscriptions
    await checkAndExpireSubscriptions()

    // Get subscription details
    const subscription = await getSubscriptionDetails(payload.id)

    return NextResponse.json({
      subscription,
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

