import { prisma } from './client'

// Favorites CRUD Operations
export const favoritesOperations = {
  // GET - Get user's favorite items
  async getByUserId(userId: string) {
    try {
      return await prisma.favorite.findMany({
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
      throw new Error(`Failed to fetch favorites: ${error}`)
    }
  },

  // CREATE - Add item to favorites
  async addItem(userId: string, productId: string) {
    try {
      // Validate inputs
      if (!userId || !productId) {
        throw new Error('User ID and Product ID are required')
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, title: true }
      })

      if (!product) {
        throw new Error('Product not found')
      }

      const existingFavorite = await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId,
            productId
          }
        }
      })

      if (existingFavorite) {
        throw new Error(`${product.title} is already in your favorites`)
      }

      return await prisma.favorite.create({
        data: {
          userId,
          productId
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
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`Failed to add item to favorites: ${error}`)
    }
  },

  // DELETE - Remove item from favorites
  async removeItem(userId: string, productId: string) {
    try {
      return await prisma.favorite.delete({
        where: {
          userId_productId: {
            userId,
            productId
          }
        }
      })
    } catch (error) {
      throw new Error(`Failed to remove item from favorites: ${error}`)
    }
  },

  // TOGGLE - Add or remove item from favorites
  async toggleItem(userId: string, productId: string) {
    try {
      // Validate inputs
      if (!userId || !productId) {
        throw new Error('User ID and Product ID are required')
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, title: true }
      })

      if (!product) {
        throw new Error('Product not found')
      }

      const existingFavorite = await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId,
            productId
          }
        }
      })

      if (existingFavorite) {
        await this.removeItem(userId, productId)
        return { action: 'removed', favorite: null }
      } else {
        const favorite = await prisma.favorite.create({
          data: {
            userId,
            productId
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
        return { action: 'added', favorite }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`Failed to toggle favorite: ${error}`)
    }
  },

  // CHECK - Check if item is in favorites
  async isFavorite(userId: string, productId: string) {
    try {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId,
            productId
          }
        }
      })
      return !!favorite
    } catch (error) {
      throw new Error(`Failed to check favorite status: ${error}`)
    }
  },

  // DELETE - Clear all favorites
  async clearFavorites(userId: string) {
    try {
      return await prisma.favorite.deleteMany({
        where: { userId }
      })
    } catch (error) {
      throw new Error(`Failed to clear favorites: ${error}`)
    }
  },

  // UTILITY - Get favorites count
  async getFavoritesCount(userId: string) {
    try {
      return await prisma.favorite.count({
        where: { userId }
      })
    } catch (error) {
      throw new Error(`Failed to get favorites count: ${error}`)
    }
  }
}