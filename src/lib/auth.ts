import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET)

export interface UserPayload {
  id: string
  email: string
  role: 'USER' | 'CARETAKER' | 'ADMIN'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function generateToken(payload: UserPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey())
  
  return token
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as 'USER' | 'CARETAKER' | 'ADMIN',
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      userProfile: true,
      caretakerProfile: true,
      adminProfile: true,
    },
  })

  if (!user || !(await verifyPassword(password, user.password))) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    profile: user.userProfile || user.caretakerProfile || user.adminProfile,
  }
}
