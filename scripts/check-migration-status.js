// Check if migration has already been completed
// Run with: node scripts/check-migration-status.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkStatus() {
  try {
    // Check if caretaker_profiles table exists
    const tableExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'caretaker_profiles'
      )
    `)

    // Check if caretakerId column exists
    const columnExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'information_requests' 
        AND column_name = 'caretakerId'
      )
    `)

    // Check if CARETAKER enum value exists
    const enumExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CARETAKER' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
      )
    `)

    const isMigrated = tableExists[0].exists && columnExists[0].exists && enumExists[0].exists

    if (isMigrated) {
      console.log('Migration already completed - skipping prisma db push')
      process.exit(0) // Success - skip db push
    } else {
      console.log('Migration not complete - running prisma db push')
      process.exit(1) // Need to run db push
    }
  } catch (error) {
    console.error('Error checking migration status:', error)
    process.exit(1) // On error, try db push
  } finally {
    await prisma.$disconnect()
  }
}

checkStatus()

