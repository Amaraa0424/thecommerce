import { prisma, connectDB } from './client'

// Database operation wrapper with retry logic and connection management
export async function withDatabaseConnection<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure connection is established
      await connectDB()
      
      // Execute the operation
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Check if it's a connection-related error
      const isConnectionError = error instanceof Error && (
        error.message.includes('prepared statement') ||
        error.message.includes('connection') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('does not exist') ||
        error.message.includes('timeout')
      )
      
      if (isConnectionError && attempt < maxRetries) {
        console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying...`, error.message)
        
        // Force disconnect and reconnect
        try {
          await prisma.$disconnect()
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        } catch (disconnectError) {
          console.warn('Error during disconnect:', disconnectError)
        }
        
        continue
      }
      
      // If it's not a connection error or we've exhausted retries, throw the error
      throw error
    }
  }
  
  throw lastError!
}

// Specific wrapper for Prisma operations that commonly fail
export async function safePrismaOperation<T>(
  operation: () => Promise<T>,
  operationName: string = 'database operation'
): Promise<T> {
  try {
    return await withDatabaseConnection(operation)
  } catch (error) {
    console.error(`Failed to execute ${operationName}:`, error)
    throw new Error(`Failed to execute ${operationName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}