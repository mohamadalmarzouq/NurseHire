// Quick fix script to add subscription columns immediately
// Run this in Render's shell: node scripts/quick-fix-subscription-columns.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function quickFix() {
  try {
    console.log('Adding subscription columns...')
    
    // Create enum if needed
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
          CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'ACTIVE', 'EXPIRED');
        END IF;
      END $$;
    `)
    console.log('✓ Enum ready')
    
    // Add columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'NONE',
      ADD COLUMN IF NOT EXISTS "subscriptionStartDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "subscriptionEndDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "subscriptionAmount" DECIMAL(10,2);
    `)
    console.log('✅ DONE! Registration should work now.')
    
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

quickFix()

