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

    // Check if CareTakerStatus enum exists (replacement for NurseStatus)
    const statusEnumExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'CareTakerStatus'
      )
    `)

    // Check if NurseStatus enum still exists (should be false)
    const nurseStatusEnumExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'NurseStatus'
      )
    `)

    // Check if no NURSE roles remain
    const nurseCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM users WHERE role::text = 'NURSE'
    `)

    const isMigrated = tableExists[0].exists && 
                      columnExists[0].exists && 
                      enumExists[0].exists &&
                      statusEnumExists[0].exists &&
                      !nurseStatusEnumExists[0].exists &&
                      parseInt(nurseCount[0].count) === 0

    if (isMigrated) {
      console.log('✓ Migration already completed - all changes applied')
      console.log('  - caretaker_profiles table exists')
      console.log('  - caretakerId column exists')
      console.log('  - CARETAKER enum value exists')
      console.log('  - CareTakerStatus enum exists')
      console.log('  - NurseStatus enum removed')
      console.log('  - No NURSE roles remaining')
      console.log('Skipping prisma db push to avoid conflicts')
      process.exit(0) // Success - skip db push
    } else {
      console.log('Migration not complete - some changes needed:')
      console.log(`  - caretaker_profiles table: ${tableExists[0].exists ? '✓' : '✗'}`)
      console.log(`  - caretakerId column: ${columnExists[0].exists ? '✓' : '✗'}`)
      console.log(`  - CARETAKER enum: ${enumExists[0].exists ? '✓' : '✗'}`)
      console.log(`  - CareTakerStatus enum: ${statusEnumExists[0].exists ? '✓' : '✗'}`)
      console.log(`  - NurseStatus enum removed: ${!nurseStatusEnumExists[0].exists ? '✓' : '✗'}`)
      console.log(`  - NURSE roles remaining: ${nurseCount[0].count}`)
      console.log('Running prisma db push...')
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

