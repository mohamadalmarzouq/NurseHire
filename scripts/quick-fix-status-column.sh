#!/bin/bash
# Quick fix for status column type
# This script can be run directly in Render's shell

node << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Checking current column type...');
    
    // Check current type
    const info = await prisma.$queryRawUnsafe(`
      SELECT udt_name 
      FROM information_schema.columns
      WHERE table_name = 'caretaker_profiles' 
      AND column_name = 'status'
    `);
    
    console.log('Current type:', info[0]?.udt_name || 'not found');
    
    if (info[0]?.udt_name === 'NurseStatus') {
      console.log('Fixing column type...');
      
      // Drop default first
      await prisma.$executeRawUnsafe(`
        ALTER TABLE caretaker_profiles 
        ALTER COLUMN status DROP DEFAULT
      `);
      
      // Change type
      await prisma.$executeRawUnsafe(`
        ALTER TABLE caretaker_profiles 
        ALTER COLUMN status TYPE "CareTakerStatus" 
        USING status::text::"CareTakerStatus"
      `);
      
      // Restore default
      await prisma.$executeRawUnsafe(`
        ALTER TABLE caretaker_profiles 
        ALTER COLUMN status SET DEFAULT 'PENDING'::"CareTakerStatus"
      `);
      
      console.log('✅ SUCCESS! Column type fixed to CareTakerStatus');
      console.log('✅ Care taker registration should now work!');
    } else if (info[0]?.udt_name === 'CareTakerStatus') {
      console.log('✅ Column already uses CareTakerStatus - no fix needed');
    } else {
      console.log('⚠️  Unexpected column type:', info[0]?.udt_name);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
EOF

