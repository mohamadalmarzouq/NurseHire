// Migration script to update database from NURSE to CARETAKER
// Run this with: node scripts/migrate-to-caretaker.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrate() {
  try {
    console.log('Starting migration from NURSE to CARETAKER...')

    // Step 1: Update all users with NURSE role to CARETAKER
    // Note: This uses raw SQL because Prisma doesn't support enum value changes directly
    const updateUsers = await prisma.$executeRaw`
      UPDATE users 
      SET role = 'CARETAKER' 
      WHERE role = 'NURSE'
    `
    console.log(`Updated ${updateUsers} users from NURSE to CARETAKER`)

    // Step 2: Check if there are any users with NURSE role left
    const remainingNurses = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users WHERE role = 'NURSE'
    `
    console.log('Remaining NURSE roles:', remainingNurses[0].count)

    // Step 3: Verify caretaker profiles exist
    const caretakerCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users WHERE role = 'CARETAKER'
    `
    console.log('Total CARETAKER roles:', caretakerCount[0].count)

    console.log('Migration completed successfully!')
    console.log('Now you can run: npx prisma db push --accept-data-loss')
    
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrate()

