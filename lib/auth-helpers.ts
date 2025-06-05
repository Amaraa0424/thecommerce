import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { NextResponse } from 'next/server'

export interface AuthValidationResult {
  success: boolean
  userId?: string
  error?: NextResponse
  debug?: string
}

/**
 * Validates user authentication and existence in database
 * Returns user ID if valid, or error response if invalid
 */
export async function validateUserAuth(): Promise<AuthValidationResult> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return {
        success: false,
        debug: 'No session found',
        error: NextResponse.json(
          { success: false, error: 'Unauthorized - No session' },
          { status: 401 }
        )
      }
    }

    if (!session.user) {
      return {
        success: false,
        debug: 'No user in session',
        error: NextResponse.json(
          { success: false, error: 'Unauthorized - No user in session' },
          { status: 401 }
        )
      }
    }

    if (!session.user.email) {
      return {
        success: false,
        debug: 'No email in session user',
        error: NextResponse.json(
          { success: false, error: 'Unauthorized - No email in session' },
          { status: 401 }
        )
      }
    }

    let user = null
    let userId = session.user.id

    // First try to find user by session ID
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, status: true, email: true }
      })
    }

    // If not found by ID, try to find by email (fallback for session issues)
    if (!user && session.user.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, status: true, email: true }
      })
      
      if (user) {
        userId = user.id // Use the correct user ID from database
      }
    }

    if (!user) {
      return {
        success: false,
        debug: `User not found - tried ID: ${session.user.id}, email: ${session.user.email}`,
        error: NextResponse.json(
          { success: false, error: 'User not found. Please log in again.' },
          { status: 401 }
        )
      }
    }

    if (user.status !== 'ACTIVE') {
      return {
        success: false,
        debug: `User account status: ${user.status}`,
        error: NextResponse.json(
          { success: false, error: 'Account is inactive. Please contact support.' },
          { status: 403 }
        )
      }
    }

    return {
      success: true,
      userId: user.id,
      debug: 'Auth validation successful'
    }
  } catch (error) {
    return {
      success: false,
      debug: `Auth validation error: ${error}`,
      error: NextResponse.json(
        { success: false, error: 'Authentication error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Validates if a product exists in the database
 */
export async function validateProductExists(productId: string): Promise<boolean> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true }
    })
    return !!product
  } catch (error) {
    return false
  }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  )
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(data?: any, message?: string) {
  return NextResponse.json({
    success: true,
    ...(data && { data }),
    ...(message && { message })
  })
}