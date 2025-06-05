import { prisma } from './client'
import { userOperations, productOperations, orderOperations } from './index'

/**
 * Utility functions for safe deletion operations with cascade handling
 */
export const deletionUtils = {
  /**
   * Delete a user and all related data (reviews, orders, cart items, favorites)
   * @param userId - The ID of the user to delete
   * @param options - Deletion options
   */
  async deleteUser(userId: string, options?: { 
    soft?: boolean 
    reason?: string 
  }) {
    const { soft = false, reason } = options || {}
    
    try {
      if (soft) {
        // Soft delete - deactivate user but keep data for business records
        return await userOperations.softDelete(userId)
      } else {
        // Hard delete - completely remove user and all related data
        return await userOperations.delete(userId)
      }
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`)
    }
  },

  /**
   * Delete a product and all related data (reviews, order items, cart items, favorites)
   * @param productId - The ID of the product to delete
   * @param options - Deletion options
   */
  async deleteProduct(productId: string, options?: { 
    soft?: boolean 
    reason?: string 
  }) {
    const { soft = false, reason } = options || {}
    
    try {
      if (soft) {
        // Soft delete - mark as discontinued but keep for order history
        return await productOperations.softDelete(productId)
      } else {
        // Hard delete - completely remove product and all related data
        return await productOperations.delete(productId)
      }
    } catch (error) {
      throw new Error(`Failed to delete product: ${error}`)
    }
  },

  /**
   * Delete an order and all related data (order items, shipping address)
   * @param orderId - The ID of the order to delete
   * @param options - Deletion options
   */
  async deleteOrder(orderId: string, options?: { 
    cancel?: boolean 
    reason?: string 
  }) {
    const { cancel = true, reason } = options || {}
    
    try {
      if (cancel) {
        // Cancel order - recommended for business records
        return await orderOperations.cancel(orderId, reason)
      } else {
        // Hard delete - completely remove order and all related data
        return await orderOperations.delete(orderId)
      }
    } catch (error) {
      throw new Error(`Failed to delete order: ${error}`)
    }
  },

  /**
   * Bulk delete multiple users
   * @param userIds - Array of user IDs to delete
   * @param options - Deletion options
   */
  async bulkDeleteUsers(userIds: string[], options?: { 
    soft?: boolean 
    batchSize?: number 
  }) {
    const { soft = false, batchSize = 10 } = options || {}
    
    try {
      const results = []
      
      // Process in batches to avoid overwhelming the database
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize)
        const batchResults = await Promise.allSettled(
          batch.map(userId => this.deleteUser(userId, { soft }))
        )
        results.push(...batchResults)
      }
      
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      return {
        total: userIds.length,
        successful,
        failed,
        results
      }
    } catch (error) {
      throw new Error(`Failed to bulk delete users: ${error}`)
    }
  },

  /**
   * Bulk delete multiple products
   * @param productIds - Array of product IDs to delete
   * @param options - Deletion options
   */
  async bulkDeleteProducts(productIds: string[], options?: { 
    soft?: boolean 
    batchSize?: number 
  }) {
    const { soft = false, batchSize = 10 } = options || {}
    
    try {
      const results = []
      
      // Process in batches to avoid overwhelming the database
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize)
        const batchResults = await Promise.allSettled(
          batch.map(productId => this.deleteProduct(productId, { soft }))
        )
        results.push(...batchResults)
      }
      
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      return {
        total: productIds.length,
        successful,
        failed,
        results
      }
    } catch (error) {
      throw new Error(`Failed to bulk delete products: ${error}`)
    }
  },

  /**
   * Get deletion impact analysis before actually deleting
   * @param type - Type of entity to analyze
   * @param id - ID of the entity
   */
  async getDeletionImpact(type: 'user' | 'product' | 'order', id: string) {
    try {
      switch (type) {
        case 'user':
          const userImpact = await prisma.user.findUnique({
            where: { id },
            include: {
              _count: {
                select: {
                  reviews: true,
                  orders: true,
                  cartItems: true,
                  favorites: true,
                  accounts: true,
                  sessions: true,
                  otpCodes: true
                }
              }
            }
          })
          
          if (!userImpact) throw new Error('User not found')
          
          return {
            type: 'user',
            id,
            name: userImpact.name,
            email: userImpact.email,
            impact: {
              reviews: userImpact._count.reviews,
              orders: userImpact._count.orders,
              cartItems: userImpact._count.cartItems,
              favorites: userImpact._count.favorites,
              accounts: userImpact._count.accounts,
              sessions: userImpact._count.sessions,
              otpCodes: userImpact._count.otpCodes
            },
            totalRelatedRecords: Object.values(userImpact._count).reduce((sum, count) => sum + count, 0)
          }

        case 'product':
          const productImpact = await prisma.product.findUnique({
            where: { id },
            include: {
              _count: {
                select: {
                  reviews: true,
                  orderItems: true,
                  cartItems: true,
                  favorites: true
                }
              }
            }
          })
          
          if (!productImpact) throw new Error('Product not found')
          
          return {
            type: 'product',
            id,
            title: productImpact.title,
            category: productImpact.category,
            impact: {
              reviews: productImpact._count.reviews,
              orderItems: productImpact._count.orderItems,
              cartItems: productImpact._count.cartItems,
              favorites: productImpact._count.favorites
            },
            totalRelatedRecords: Object.values(productImpact._count).reduce((sum, count) => sum + count, 0)
          }

        case 'order':
          const orderImpact = await prisma.order.findUnique({
            where: { id },
            include: {
              _count: {
                select: {
                  items: true
                }
              },
              shippingAddress: {
                select: { id: true }
              }
            }
          })
          
          if (!orderImpact) throw new Error('Order not found')
          
          return {
            type: 'order',
            id,
            customerName: orderImpact.customerName,
            total: orderImpact.total,
            status: orderImpact.status,
            impact: {
              orderItems: orderImpact._count.items,
              shippingAddress: orderImpact.shippingAddress ? 1 : 0
            },
            totalRelatedRecords: orderImpact._count.items + (orderImpact.shippingAddress ? 1 : 0)
          }

        default:
          throw new Error('Invalid type specified')
      }
    } catch (error) {
      throw new Error(`Failed to analyze deletion impact: ${error}`)
    }
  },

  /**
   * Clean up orphaned records (records that reference non-existent entities)
   */
  async cleanupOrphanedRecords() {
    try {
      const results = {
        orphanedReviews: 0,
        orphanedOrderItems: 0,
        orphanedCartItems: 0,
        orphanedFavorites: 0
      }

      // Find and delete orphaned reviews (reviews for non-existent users or products)
      const orphanedReviews = await prisma.review.findMany({
        where: {
          OR: [
            { user: null },
            { product: null }
          ]
        }
      })
      
      if (orphanedReviews.length > 0) {
        await prisma.review.deleteMany({
          where: {
            id: { in: orphanedReviews.map(r => r.id) }
          }
        })
        results.orphanedReviews = orphanedReviews.length
      }

      // Similar cleanup for other orphaned records...
      // (Implementation would depend on specific business requirements)

      return results
    } catch (error) {
      throw new Error(`Failed to cleanup orphaned records: ${error}`)
    }
  }
}