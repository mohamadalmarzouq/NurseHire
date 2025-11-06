// Migration script to copy nightShiftSalary to fullTimeSalary
// Run this after the schema migration succeeds

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migratePricing() {
  try {
    console.log('Starting pricing migration...')
    
    // Get all nurse profiles with nightShiftSalary
    const nurses = await prisma.nurseProfile.findMany({
      where: {
        nightShiftSalary: {
          not: null
        }
      }
    })

    console.log(`Found ${nurses.length} nurses to migrate`)

    // Update each nurse profile
    for (const nurse of nurses) {
      await prisma.nurseProfile.update({
        where: { id: nurse.id },
        data: {
          fullTimeSalary: nurse.nightShiftSalary || 0,
          nightShiftSalary: null // Clear the old field after migration
        }
      })
      console.log(`Migrated nurse ${nurse.id}: ${nurse.nightShiftSalary} -> ${nurse.fullTimeSalary}`)
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migratePricing()

