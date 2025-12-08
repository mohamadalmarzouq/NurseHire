import { prisma } from './prisma'

export type SubscriptionStatus = 'NONE' | 'ACTIVE' | 'EXPIRED'

/**
 * Check if a user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      subscriptionEndDate: true,
    },
  })

  if (!user) return false

  // Check if subscription is ACTIVE and not expired
  if (user.subscriptionStatus === 'ACTIVE') {
    // If there's an end date, check if it's still valid
    if (user.subscriptionEndDate) {
      return new Date() < user.subscriptionEndDate
    }
    // If no end date but status is ACTIVE, consider it active
    return true
  }

  return false
}

/**
 * Activate a subscription for a user (30 days from now)
 */
export async function activateSubscription(
  userId: string,
  amount: number = 15.0
): Promise<void> {
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 30) // 30 days from now

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'ACTIVE',
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      subscriptionAmount: amount,
    },
  })
}

/**
 * Deactivate/expire a subscription for a user
 */
export async function deactivateSubscription(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'EXPIRED',
    },
  })
}

/**
 * Get subscription details for a user
 */
export async function getSubscriptionDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      subscriptionStartDate: true,
      subscriptionEndDate: true,
      subscriptionAmount: true,
    },
  })

  if (!user) {
    return {
      status: 'NONE' as SubscriptionStatus,
      startDate: null,
      endDate: null,
      amount: null,
      isActive: false,
    }
  }

  const isActive = await hasActiveSubscription(userId)

  return {
    status: user.subscriptionStatus as SubscriptionStatus,
    startDate: user.subscriptionStartDate,
    endDate: user.subscriptionEndDate,
    amount: user.subscriptionAmount ? Number(user.subscriptionAmount) : null,
    isActive,
  }
}

/**
 * Check and auto-expire subscriptions that have passed their end date
 * This should be run periodically (e.g., via cron job or on login)
 */
export async function checkAndExpireSubscriptions(): Promise<number> {
  const now = new Date()
  
  const result = await prisma.user.updateMany({
    where: {
      subscriptionStatus: 'ACTIVE',
      subscriptionEndDate: {
        lt: now, // Less than now = expired
      },
    },
    data: {
      subscriptionStatus: 'EXPIRED',
    },
  })

  return result.count
}

