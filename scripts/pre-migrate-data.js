// Pre-migration script: Update existing NURSE data to CARETAKER before schema migration
// This must be run BEFORE prisma db push
// Run with: node scripts/pre-migrate-data.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function preMigrate() {
  try {
    console.log('Starting pre-migration: Updating NURSE to CARETAKER...')

    // Step 1: First, add CARETAKER to the enum (if it doesn't exist)
    // PostgreSQL requires adding the new value before we can use it
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CARETAKER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')) THEN
            ALTER TYPE "UserRole" ADD VALUE 'CARETAKER';
          END IF;
        END $$;
      `)
      console.log('✓ Added CARETAKER to UserRole enum')
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('ℹ️  CARETAKER already exists in UserRole enum')
      } else {
        throw error
      }
    }

    // Step 2: Update all users with NURSE role to CARETAKER using raw SQL
    // This bypasses Prisma's type checking since the enum hasn't been fully updated yet
    const result = await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET role = 'CARETAKER'::"UserRole"
      WHERE role = 'NURSE'::"UserRole"
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
    // Check if table exists first
    const tableExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'nurse_profiles'
      )
    `)
    
    if (tableExists[0].exists) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE nurse_profiles RENAME TO caretaker_profiles
        `)
        console.log('✓ Renamed nurse_profiles table to caretaker_profiles')
      } catch (error) {
        console.log('ℹ️  Could not rename table (may already be renamed):', error.message)
      }
    } else {
      console.log('ℹ️  nurse_profiles table does not exist (may already be renamed)')
    }

    // Step 4: Rename column if it exists
    const columnExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'information_requests' 
        AND column_name = 'nurseId'
      )
    `)
    
    if (columnExists[0].exists) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE information_requests 
          RENAME COLUMN "nurseId" TO "caretakerId"
        `)
        console.log('✓ Renamed nurseId column to caretakerId')
      } catch (error) {
        console.log('ℹ️  Could not rename column (may already be renamed):', error.message)
      }
    } else {
      console.log('ℹ️  nurseId column does not exist (may already be renamed)')
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

