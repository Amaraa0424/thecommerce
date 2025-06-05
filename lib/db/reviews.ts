import { prisma } from './client'
import type { Review } from '@prisma/client'
import { Prisma } from '@prisma/client'

// Review CRUD Operations
export const reviewOperations = {
  // CREATE
  async create(data: {
    productId: string
    userId: string
    userName: string
    rating: number
    comment: string
  }) {
    try {
      // Check if user already reviewed this product
      const existingReview = await prisma.review.findFirst({
        where: {
          productId: data.productId,
          userId: data.userId
        }
      })

      if (existingReview) {
        throw new Error('User has already reviewed this product')
      }

      // Create the review
      const review = await prisma.review.create({
        data,
        include: {
          user: {
            select: { id: true, name: true, image: true }
          },
          product: {
            select: { id: true, title: true, images: true }
          }
        }
      })

      // Update product rating and review count
      await this.updateProductRating(data.productId)

      return review
    } catch (error) {
      throw new Error(`Failed to create review: ${error}`)
    }
  },

  // READ - Get all reviews with filters
  async getAll(options?: {
    productId?: string
    userId?: string
    rating?: number
    sortBy?: 'createdAt' | 'rating'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) {
    try {
      const {
        productId,
        userId,
        rating,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = options || {}

      const where: Prisma.ReviewWhereInput = {}

      if (productId) where.productId = productId
      if (userId) where.userId = userId
      if (rating) where.rating = rating

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, image: true }
            },
            product: {
              select: { id: true, title: true, images: true }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.review.count({ where })
      ])

      return {
        reviews,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      throw new Error(`Failed to fetch reviews: ${error}`)
    }
  },

  // READ - Get single review by ID
  async getById(id: string) {
    try {
      const review = await prisma.review.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, image: true }
          },
          product: {
            select: { id: true, title: true, images: true }
          }
        }
      })

      if (!review) {
        throw new Error('Review not found')
      }

      return review
    } catch (error) {
      throw new Error(`Failed to fetch review: ${error}`)
    }
  },

  // READ - Get product reviews
  async getProductReviews(productId: string, options?: {
    rating?: number
    sortBy?: 'createdAt' | 'rating'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) {
    try {
      const {
        rating,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = options || {}

      const where: Prisma.ReviewWhereInput = { productId }
      if (rating) where.rating = rating

      const [reviews, total, ratingStats] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, image: true }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.review.count({ where }),
        this.getProductRatingStats(productId)
      ])

      return {
        reviews,
        ratingStats,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      throw new Error(`Failed to fetch product reviews: ${error}`)
    }
  },

  // UPDATE
  async update(id: string, data: {
    rating?: number
    comment?: string
  }) {
    try {
      const review = await prisma.review.update({
        where: { id },
        data,
        include: {
          user: {
            select: { id: true, name: true, image: true }
          },
          product: {
            select: { id: true, title: true, images: true }
          }
        }
      })

      // Update product rating if rating was changed
      if (data.rating !== undefined) {
        await this.updateProductRating(review.productId)
      }

      return review
    } catch (error) {
      throw new Error(`Failed to update review: ${error}`)
    }
  },

  // DELETE
  async delete(id: string) {
    try {
      const review = await prisma.review.findUnique({
        where: { id },
        select: { productId: true }
      })

      if (!review) {
        throw new Error('Review not found')
      }

      const deletedReview = await prisma.review.delete({
        where: { id }
      })

      // Update product rating after deletion
      await this.updateProductRating(review.productId)

      return deletedReview
    } catch (error) {
      throw new Error(`Failed to delete review: ${error}`)
    }
  },

  // UTILITY - Update product rating and review count
  async updateProductRating(productId: string) {
    try {
      const stats = await prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true }
      })

      const averageRating = stats._avg.rating || 0
      const reviewCount = stats._count.rating || 0

      await prisma.product.update({
        where: { id: productId },
        data: {
          rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          reviewCount
        }
      })

      return { averageRating, reviewCount }
    } catch (error) {
      throw new Error(`Failed to update product rating: ${error}`)
    }
  },

  // UTILITY - Get product rating statistics
  async getProductRatingStats(productId: string) {
    try {
      const [ratingCounts, averageRating] = await Promise.all([
        prisma.review.groupBy({
          by: ['rating'],
          where: { productId },
          _count: { rating: true },
          orderBy: { rating: 'desc' }
        }),
        prisma.review.aggregate({
          where: { productId },
          _avg: { rating: true },
          _count: { rating: true }
        })
      ])

      // Create rating distribution (1-5 stars)
      const distribution = Array.from({ length: 5 }, (_, i) => {
        const rating = 5 - i
        const found = ratingCounts.find(r => r.rating === rating)
        return {
          rating,
          count: found?._count.rating || 0
        }
      })

      return {
        average: Math.round((averageRating._avg.rating || 0) * 10) / 10,
        total: averageRating._count.rating || 0,
        distribution
      }
    } catch (error) {
      throw new Error(`Failed to fetch product rating stats: ${error}`)
    }
  }
}