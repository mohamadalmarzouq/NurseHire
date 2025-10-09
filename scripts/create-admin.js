const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@nursehire.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    })
    
    // Create admin profile
    const adminProfile = await prisma.adminProfile.create({
      data: {
        userId: adminUser.id,
        name: 'Admin User',
      },
    })
    
    console.log('✅ Admin account created successfully!')
    console.log('📧 Email: admin@nursehire.com')
    console.log('🔑 Password: admin123')
    console.log('🆔 User ID:', adminUser.id)
    console.log('👤 Profile ID:', adminProfile.id)
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
