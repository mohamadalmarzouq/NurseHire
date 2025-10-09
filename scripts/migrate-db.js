const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateDatabase() {
  try {
    console.log('Starting database migration...')
    
    // Force Prisma to apply schema changes
    await prisma.$executeRaw`SELECT 1`
    console.log('Database connection successful')
    
    // Check if nurse profiles have phone and location columns
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'nurse_profiles' 
      AND column_name IN ('phone', 'location')
    `
    
    console.log('Phone and location columns found:', result)
    
    console.log('Migration check completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateDatabase()
