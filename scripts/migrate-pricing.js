// Migration script to copy nightShiftSalary to fullTimeSalary using raw SQL
// This is needed because nightShiftSalary is no longer in the Prisma schema
// but may still exist in the database

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migratePricing() {
  try {
    console.log('Starting pricing migration...')
    
    // Use raw SQL to check if nightShiftSalary column exists and migrate data
    // First, copy any non-null nightShiftSalary values to fullTimeSalary
    const result = await prisma.$executeRaw`
      UPDATE nurse_profiles
      SET "fullTimeSalary" = COALESCE("nightShiftSalary", "fullTimeSalary", 0)
      WHERE "nightShiftSalary" IS NOT NULL 
        AND ("fullTimeSalary" = 0 OR "fullTimeSalary" IS NULL)
    `

    console.log(`Updated ${result} nurse profiles`)

    // Then clear the nightShiftSalary column
    try {
      await prisma.$executeRaw`
        UPDATE nurse_profiles
        SET "nightShiftSalary" = NULL
        WHERE "nightShiftSalary" IS NOT NULL
      `
      console.log('Cleared nightShiftSalary column')
    } catch (err) {
      // Column might already be dropped, that's fine
      console.log('Note: Could not clear nightShiftSalary (column may already be dropped)')
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration error:', error)
    // If the column doesn't exist, that's fine - migration already complete
    if (error.message && error.message.includes('nightShiftSalary')) {
      console.log('Note: nightShiftSalary column does not exist - migration may already be complete')
    } else {
      throw error
    }
  } finally {
    await prisma.$disconnect()
  }
}

migratePricing()

