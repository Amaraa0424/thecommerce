import { PrismaClient } from '@prisma/client'

// Global Prisma instance to prevent multiple connections
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with appropriate configuration for environment
const createPrismaClient = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return new PrismaClient({
    log: isDevelopment ? ['error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: isDevelopment 
          ? process.env.DATABASE_URL // Direct connection for development
          : process.env.POOLED_DATABASE_URL || process.env.DATABASE_URL // Pooled for production
      }
    }
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Enhanced connection management
let isConnected = false

export const connectDB = async () => {
  if (isConnected) return

  try {
    await prisma.$connect()
    isConnected = true
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

export const disconnectDB = async () => {
  if (!isConnected) return

  try {
    await prisma.$disconnect()
    isConnected = false
    console.log('✅ Database disconnected successfully')
  } catch (error) {
    console.error('❌ Database disconnection failed:', error)
  }
}

// Graceful shutdown handlers
const cleanup = async () => {
  await disconnectDB()
  process.exit(0)
}

process.on('beforeExit', cleanup)
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

// Handle hot reload in development
if (process.env.NODE_ENV === 'development') {
  process.on('SIGUSR2', cleanup) // nodemon restart
}