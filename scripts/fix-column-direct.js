// Quick fix script - can be run immediately
// Run with: node scripts/fix-column-direct.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixColumn() {
  try {
    console.log('Fixing status column type...')
    
    // Update the column type directly
    await prisma.$executeRawUnsafe(`
      ALTER TABLE caretaker_profiles 
      ALTER COLUMN status TYPE "CareTakerStatus" 
      USING status::text::"CareTakerStatus"
    `)
    
    console.log('✅ Column type updated successfully!')
    console.log('✅ Care taker registration should now work!')
    
  } catch (error) {
    console.error('Error:', error.message)
    
    // If that fails, try without USING clause
    if (error.message.includes('cannot be cast') || error.message.includes('USING')) {
      console.log('Trying alternative method...')
      try {
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
        
        console.log('✅ Column type updated using alternative method!')
      } catch (altError) {
        console.error('Alternative method failed:', altError.message)
      }
    }
  } finally {
    await prisma.$disconnect()
  }
}

fixColumn()

