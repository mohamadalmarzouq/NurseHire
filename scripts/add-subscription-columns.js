// Script to add subscription columns to users table
// This must be run BEFORE prisma db push if the columns don't exist
// Run with: node scripts/add-subscription-columns.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addSubscriptionColumns() {
  try {
    console.log('Starting subscription columns migration...')

    // Check if subscriptionStatus column exists
    const columnExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'subscriptionStatus'
      )
    `)

    if (columnExists[0].exists) {
      console.log('✓ Subscription columns already exist - skipping migration')
      return
    }

    // Step 1: Create SubscriptionStatus enum if it doesn't exist
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
            CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'ACTIVE', 'EXPIRED');
          END IF;
        END $$;
      `)
      console.log('✓ Created SubscriptionStatus enum')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  SubscriptionStatus enum already exists')
      } else {
        throw error
      }
    }

    // Step 2: Add subscription columns to users table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'NONE',
      ADD COLUMN IF NOT EXISTS "subscriptionStartDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "subscriptionEndDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "subscriptionAmount" DECIMAL(10,2);
    `)
    console.log('✓ Added subscription columns to users table')

    console.log('\n✅ Subscription columns migration completed successfully!')
    console.log('You can now run: npx prisma db push')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addSubscriptionColumns()

