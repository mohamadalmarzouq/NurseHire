// Script to fix the NurseStatus -> CareTakerStatus enum rename issue
// This can be run directly in Render's shell to fix the immediate error
// Run with: node scripts/fix-enum-status.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixEnumStatus() {
  try {
    console.log('Starting enum status fix...')

    // Check if NurseStatus enum exists
    const nurseStatusExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'NurseStatus'
      )
    `)

    if (nurseStatusExists[0].exists) {
      console.log('Found NurseStatus enum - renaming to CareTakerStatus...')
      
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TYPE "NurseStatus" RENAME TO "CareTakerStatus"
        `)
        console.log('✅ Successfully renamed NurseStatus enum to CareTakerStatus')
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          console.log('ℹ️  CareTakerStatus may already exist or NurseStatus does not exist')
          console.log('   Error details:', error.message)
        } else {
          throw error
        }
      }
    } else {
      console.log('ℹ️  NurseStatus enum does not exist')
      
      // Check if CareTakerStatus already exists
      const caretakerStatusExists = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT 1 FROM pg_type 
          WHERE typname = 'CareTakerStatus'
        )
      `)
      
      if (caretakerStatusExists[0].exists) {
        console.log('✅ CareTakerStatus enum already exists - no action needed')
      } else {
        console.log('⚠️  Warning: Neither NurseStatus nor CareTakerStatus enum found!')
        console.log('   This may indicate a database schema issue.')
      }
    }

    // Verify the fix
    const caretakerStatusExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'CareTakerStatus'
      )
    `)

    if (caretakerStatusExists[0].exists) {
      console.log('\n✅ Verification: CareTakerStatus enum exists')
      console.log('   The registration error should now be fixed!')
    } else {
      console.log('\n❌ Verification failed: CareTakerStatus enum does not exist')
      console.log('   You may need to run the full migration script.')
    }

  } catch (error) {
    console.error('❌ Error fixing enum status:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixEnumStatus()

