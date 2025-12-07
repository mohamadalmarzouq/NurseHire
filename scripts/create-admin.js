// Script to create or update an admin user
// Run with: node scripts/create-admin.js <email> <password> <name>
// Example: node scripts/create-admin.js admin@example.com mypassword123 Admin User

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const email = process.argv[2]
    const password = process.argv[3]
    const name = process.argv[4] || 'Admin'

    if (!email || !password) {
      console.error('❌ Error: Email and password are required')
      console.log('\nUsage: node scripts/create-admin.js <email> <password> [name]')
      console.log('Example: node scripts/create-admin.js admin@example.com mypassword123 "Admin User"')
      process.exit(1)
    }

    console.log('Creating admin user...')
    console.log(`Email: ${email}`)
    console.log(`Name: ${name}`)

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      // Update existing user to admin
      if (existing.role !== 'ADMIN') {
        await prisma.user.update({
          where: { email },
          data: {
            role: 'ADMIN',
            password: hashedPassword
          }
        })
        console.log('✓ Updated existing user to admin role')
      } else {
        // Just update password
        await prisma.user.update({
          where: { email },
          data: { password: hashedPassword }
        })
        console.log('✓ Updated admin password')
      }

      // Update or create admin profile
      const adminProfile = await prisma.adminProfile.findUnique({
        where: { userId: existing.id }
      })

      if (adminProfile) {
        await prisma.adminProfile.update({
          where: { userId: existing.id },
          data: { name }
        })
        console.log('✓ Updated admin profile')
      } else {
        await prisma.adminProfile.create({
          data: {
            userId: existing.id,
            name
          }
        })
        console.log('✓ Created admin profile')
      }
    } else {
      // Create new admin user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'ADMIN',
          adminProfile: {
            create: {
              name
            }
          }
        }
      })
      console.log('✓ Created new admin user')
    }

    console.log('\n✅ Admin user created/updated successfully!')
    console.log(`\nYou can now login with:`)
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${password}`)
    
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

