// Verification script to check migration status
// Run with: node scripts/verify-migration.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verify() {
  try {
    console.log('🔍 Verifying migration status...\n')

    // 1. Check UserRole enum values
    const enumValues = await prisma.$queryRawUnsafe(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
      ORDER BY enumlabel
    `)
    console.log('📋 UserRole enum values:')
    enumValues.forEach(v => console.log(`   - ${v.enumlabel}`))

    // 2. Check user roles distribution
    const roleDistribution = await prisma.$queryRawUnsafe(`
      SELECT role::text as role, COUNT(*) as count 
      FROM users 
      GROUP BY role::text
      ORDER BY role
    `)
    console.log('\n👥 User roles distribution:')
    roleDistribution.forEach(r => console.log(`   - ${r.role}: ${r.count} users`))

    // 3. Check if caretaker_profiles table exists
    const caretakerTable = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'caretaker_profiles'
      )
    `)
    console.log(`\n📊 caretaker_profiles table exists: ${caretakerTable[0].exists ? '✅' : '❌'}`)

    // 4. Check if nurse_profiles table still exists (should not)
    const nurseTable = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'nurse_profiles'
      )
    `)
    console.log(`📊 nurse_profiles table still exists: ${nurseTable[0].exists ? '⚠️  (should be renamed)' : '✅'}`)

    // 5. Check caretakerId column
    const caretakerIdColumn = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'information_requests' 
        AND column_name = 'caretakerId'
      )
    `)
    console.log(`📊 caretakerId column exists: ${caretakerIdColumn[0].exists ? '✅' : '❌'}`)

    // 6. Check nurseId column (should not exist)
    const nurseIdColumn = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'information_requests' 
        AND column_name = 'nurseId'
      )
    `)
    console.log(`📊 nurseId column still exists: ${nurseIdColumn[0].exists ? '⚠️  (should be renamed)' : '✅'}`)

    // 7. Check CareTakerStatus enum
    const statusEnum = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'CareTakerStatus'
      )
    `)
    console.log(`📊 CareTakerStatus enum exists: ${statusEnum[0].exists ? '✅' : '❌'}`)

    // 8. Check NurseStatus enum (should not exist)
    const oldStatusEnum = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'NurseStatus'
      )
    `)
    console.log(`📊 NurseStatus enum still exists: ${oldStatusEnum[0].exists ? '⚠️  (should be removed)' : '✅'}`)

    // 9. Count caretaker profiles
    const caretakerCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM caretaker_profiles
    `)
    console.log(`\n📈 Total caretaker profiles: ${caretakerCount[0].count}`)

    // Summary
    console.log('\n' + '='.repeat(50))
    const allGood = caretakerTable[0].exists && 
                    !nurseTable[0].exists &&
                    caretakerIdColumn[0].exists &&
                    !nurseIdColumn[0].exists &&
                    statusEnum[0].exists &&
                    !oldStatusEnum[0].exists

    if (allGood) {
      console.log('✅ Migration verification: ALL CHECKS PASSED!')
      console.log('   Your database is fully migrated to Care Takers.')
    } else {
      console.log('⚠️  Migration verification: Some issues detected')
      console.log('   Review the checks above and fix any remaining issues.')
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

verify()

