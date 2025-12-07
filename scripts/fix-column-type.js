// Script to fix the status column type in caretaker_profiles table
// This ensures the column uses CareTakerStatus instead of NurseStatus
// Run with: node scripts/fix-column-type.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixColumnType() {
  try {
    console.log('Starting column type fix...')

    // Check current column type
    const columnInfo = await prisma.$queryRawUnsafe(`
      SELECT 
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'caretaker_profiles'
        AND column_name = 'status'
    `)

    if (columnInfo.length === 0) {
      console.log('⚠️  caretaker_profiles.status column not found')
      return
    }

    console.log('Current column type:', columnInfo[0].udt_name)

    if (columnInfo[0].udt_name === 'NurseStatus') {
      console.log('Found NurseStatus type - updating to CareTakerStatus...')
      
      // First, ensure CareTakerStatus enum exists
      const caretakerStatusExists = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT 1 FROM pg_type 
          WHERE typname = 'CareTakerStatus'
        )
      `)

      if (!caretakerStatusExists[0].exists) {
        console.log('❌ CareTakerStatus enum does not exist!')
        console.log('   Please run fix-enum-status.js first')
        return
      }

      // Update the column type
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE caretaker_profiles 
          ALTER COLUMN status TYPE "CareTakerStatus" 
          USING status::text::"CareTakerStatus"
        `)
        console.log('✅ Successfully updated column type to CareTakerStatus')
      } catch (error) {
        console.error('❌ Error updating column type:', error.message)
        
        // Try alternative approach - drop and recreate with correct type
        if (error.message.includes('cannot be cast')) {
          console.log('Attempting alternative fix...')
          try {
            // First, check if we can safely convert values
            const values = await prisma.$queryRawUnsafe(`
              SELECT DISTINCT status::text as status_value 
              FROM caretaker_profiles
            `)
            console.log('Current status values:', values.map(v => v.status_value))
            
            // The values should be the same (PENDING, APPROVED, REJECTED)
            // So we can safely alter the type
            await prisma.$executeRawUnsafe(`
              ALTER TABLE caretaker_profiles 
              ALTER COLUMN status DROP DEFAULT
            `)
            
            await prisma.$executeRawUnsafe(`
              ALTER TABLE caretaker_profiles 
              ALTER COLUMN status TYPE "CareTakerStatus" 
              USING status::text::"CareTakerStatus"
            `)
            
            await prisma.$executeRawUnsafe(`
              ALTER TABLE caretaker_profiles 
              ALTER COLUMN status SET DEFAULT 'PENDING'::"CareTakerStatus"
            `)
            
            console.log('✅ Successfully updated column type using alternative method')
          } catch (altError) {
            console.error('❌ Alternative method also failed:', altError.message)
            throw altError
          }
        } else {
          throw error
        }
      }
    } else if (columnInfo[0].udt_name === 'CareTakerStatus') {
      console.log('✅ Column already uses CareTakerStatus type - no action needed')
    } else {
      console.log(`⚠️  Unexpected column type: ${columnInfo[0].udt_name}`)
    }

    // Verify the fix
    const finalColumnInfo = await prisma.$queryRawUnsafe(`
      SELECT udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'caretaker_profiles'
        AND column_name = 'status'
    `)

    if (finalColumnInfo[0].udt_name === 'CareTakerStatus') {
      console.log('\n✅ Verification: Column type is now CareTakerStatus')
      console.log('   The registration error should now be fixed!')
    } else {
      console.log(`\n⚠️  Verification: Column type is still ${finalColumnInfo[0].udt_name}`)
      console.log('   Manual intervention may be required')
    }

  } catch (error) {
    console.error('❌ Error fixing column type:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixColumnType()

