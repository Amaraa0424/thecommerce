import { NextRequest, NextResponse } from 'next/server'
import { cartOperations } from '@/lib/db'
import { validateUserAuth, validateProductExists, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateUserAuth()
    if (!authResult.success) {
      return authResult.error!
    }

    const cartSummary = await cartOperations.getCartSummary(authResult.userId!)

    return createSuccessResponse(cartSummary)
  } catch (error) {
    console.error('Cart API Error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch cart',
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

    const { productId, quantity = 1 } = await request.json()

    if (!productId) {
      return createErrorResponse('Product ID is required')
    }

    if (!(await validateProductExists(productId))) {
      return createErrorResponse('Product not found', 404)
    }

    const cartItem = await cartOperations.addItem(authResult.userId!, productId, quantity)

    return createSuccessResponse(cartItem, 'Item added to cart')
  } catch (error) {
    console.error('Add to Cart API Error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to add item to cart',
      500
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await validateUserAuth()
    if (!authResult.success) {
      return authResult.error!
    }

    const { productId, quantity } = await request.json()

    if (!productId || quantity === undefined) {
      return createErrorResponse('Product ID and quantity are required')
    }

    const cartItem = await cartOperations.updateQuantity(authResult.userId!, productId, quantity)

    return createSuccessResponse(cartItem, 'Cart item updated')
  } catch (error) {
    console.error('Update Cart API Error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to update cart item',
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
      // Clear entire cart
      await cartOperations.clearCart(authResult.userId!)
      return createSuccessResponse(null, 'Cart cleared')
    } else {
      // Remove specific item
      await cartOperations.removeItem(authResult.userId!, productId)
      return createSuccessResponse(null, 'Item removed from cart')
    }
  } catch (error) {
    console.error('Remove from Cart API Error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to remove item from cart',
      500
    )
  }
}