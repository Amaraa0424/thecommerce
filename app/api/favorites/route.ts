import { NextRequest, NextResponse } from 'next/server'
import { favoritesOperations } from '@/lib/db'
import { validateUserAuth, validateProductExists, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateUserAuth()
    if (!authResult.success) {
      return authResult.error!
    }

    const favorites = await favoritesOperations.getByUserId(authResult.userId!)

    return createSuccessResponse(favorites)
  } catch (error) {
    console.error('Favorites API Error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch favorites',
      500
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await validateUserAuth()
    if (!authResult.success) {
      return authResult.error!
    }

    const { productId, action = 'toggle' } = await request.json()

    if (!productId) {
      return createErrorResponse('Product ID is required')
    }

    if (!(await validateProductExists(productId))) {
      return createErrorResponse('Product not found', 404)
    }

    if (action === 'toggle') {
      const result = await favoritesOperations.toggleItem(authResult.userId!, productId)
      return createSuccessResponse(
        result,
        result.action === 'added' ? 'Added to favorites' : 'Removed from favorites'
      )
    } else if (action === 'add') {
      const favorite = await favoritesOperations.addItem(authResult.userId!, productId)
      return createSuccessResponse(favorite, 'Added to favorites')
    } else {
      return createErrorResponse('Invalid action')
    }
  } catch (error) {
    console.error('Add to Favorites API Error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to update favorites',
      500
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await validateUserAuth()
    if (!authResult.success) {
      return authResult.error!
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      // Clear all favorites
      await favoritesOperations.clearFavorites(authResult.userId!)
      return createSuccessResponse(null, 'All favorites cleared')
    } else {
      // Remove specific item
      await favoritesOperations.removeItem(authResult.userId!, productId)
      return createSuccessResponse(null, 'Removed from favorites')
    }
  } catch (error) {
    console.error('Remove from Favorites API Error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to remove from favorites',
      500
    )
  }
}