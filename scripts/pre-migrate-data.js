// Pre-migration script: Update existing NURSE data to CARETAKER before schema migration
// This must be run BEFORE prisma db push
// Run with: node scripts/pre-migrate-data.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function preMigrate() {
  try {
    console.log('Starting pre-migration: Updating NURSE to CARETAKER...')

    // Step 1: Update all users with NURSE role to CARETAKER using raw SQL
    // This bypasses Prisma's type checking since the enum hasn't been updated yet
    const result = await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET role = 'CARETAKER' 
      WHERE role = 'NURSE'
    `)
    console.log(`✓ Updated ${result} users from NURSE to CARETAKER`)

    // Step 2: Verify no NURSE roles remain
    const remaining = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM users WHERE role = 'NURSE'
    `)
    console.log(`✓ Remaining NURSE roles: ${remaining[0].count}`)

    if (remaining[0].count > 0) {
      console.warn('⚠️  Warning: Some NURSE roles still exist!')
    }

    // Step 3: Rename table if it exists (using raw SQL)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE IF EXISTS nurse_profiles RENAME TO caretaker_profiles
      `)
      console.log('✓ Renamed nurse_profiles table to caretaker_profiles')
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('ℹ️  nurse_profiles table does not exist (may already be renamed)')
      } else {
        throw error
      }
    }

    // Step 4: Rename column if it exists
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE IF EXISTS information_requests 
        RENAME COLUMN IF EXISTS "nurseId" TO "caretakerId"
      `)
      console.log('✓ Renamed nurseId column to caretakerId')
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('ℹ️  nurseId column does not exist (may already be renamed)')
      } else {
        throw error
      }
    }

    console.log('\n✅ Pre-migration completed successfully!')
    console.log('You can now run: npx prisma db push --accept-data-loss')
    
  } catch (error) {
    console.error('❌ Pre-migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

preMigrate()

