import { prisma } from './client'
import type { Prisma } from '@prisma/client'

// Cart CRUD Operations
export const cartOperations = {
  // GET - Get user's cart items
  async getByUserId(userId: string) {
    try {
      return await prisma.cartItem.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              _count: {
                select: { reviews: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      throw new Error(`Failed to fetch cart items: ${error}`)
    }
  },

  // CREATE/UPDATE - Add item to cart or update quantity
  async addItem(userId: string, productId: string, quantity: number = 1) {
    try {
      // Validate inputs
      if (!userId || !productId) {
        throw new Error('User ID and Product ID are required')
      }

      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0')
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Check if product exists and is available
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, availability: true, title: true }
      })

      if (!product) {
        throw new Error('Product not found')
      }

      if (product.availability === 'out-of-stock') {
        throw new Error(`${product.title} is currently out of stock`)
      }

      const existingItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId,
            productId
          }
        }
      })

      if (existingItem) {
        // Update quantity
        return await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { 
            quantity: existingItem.quantity + quantity,
            updatedAt: new Date()
          },
          include: {
            product: {
              include: {
                _count: {
                  select: { reviews: true }
                }
              }
            }
          }
        })
      } else {
        // Create new cart item
        return await prisma.cartItem.create({
          data: {
            userId,
            productId,
            quantity
          },
          include: {
            product: {
              include: {
                _count: {
                  select: { reviews: true }
                }
              }
            }
          }
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`Failed to add item to cart: ${error}`)
    }
  },

  // UPDATE - Update item quantity
  async updateQuantity(userId: string, productId: string, quantity: number) {
    try {
      if (quantity <= 0) {
        return await this.removeItem(userId, productId)
      }

      return await prisma.cartItem.update({
        where: {
          userId_productId: {
            userId,
            productId
          }
        },
        data: { 
          quantity,
          updatedAt: new Date()
        },
        include: {
          product: {
            include: {
              _count: {
                select: { reviews: true }
              }
            }
          }
        }
      })
    } catch (error) {
      throw new Error(`Failed to update cart item quantity: ${error}`)
    }
  },

  // DELETE - Remove item from cart
  async removeItem(userId: string, productId: string) {
    try {
      return await prisma.cartItem.delete({
        where: {
          userId_productId: {
            userId,
            productId
          }
        }
      })
    } catch (error) {
      throw new Error(`Failed to remove item from cart: ${error}`)
    }
  },

  // DELETE - Clear entire cart
  async clearCart(userId: string) {
    try {
      return await prisma.cartItem.deleteMany({
        where: { userId }
      })
    } catch (error) {
      throw new Error(`Failed to clear cart: ${error}`)
    }
  },

  // UTILITY - Get cart summary
  async getCartSummary(userId: string) {
    try {
      const cartItems = await this.getByUserId(userId)
      
      const total = cartItems.reduce((sum, item) => 
        sum + (item.product.price * item.quantity), 0
      )
      
      const itemCount = cartItems.reduce((sum, item) => 
        sum + item.quantity, 0
      )

      return {
        items: cartItems,
        total,
        itemCount
      }
    } catch (error) {
      throw new Error(`Failed to get cart summary: ${error}`)
    }
  }
}