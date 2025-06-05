import { prisma } from './client'
import type { Product } from '@prisma/client'
import { Prisma } from '@prisma/client'

// Product CRUD Operations
export const productOperations = {
  // CREATE
  async create(data: Omit<Prisma.ProductCreateInput, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      return await prisma.product.create({
        data,
        include: {
          reviews: {
            include: {
              user: {
                select: { id: true, name: true, image: true }
              }
            }
          },
          _count: {
            select: { reviews: true }
          }
        }
      })
    } catch (error) {
      throw new Error(`Failed to create product: ${error}`)
    }
  },

  // READ - Get all products with filters
  async getAll(options?: {
    category?: string
    search?: string
    minPrice?: number
    maxPrice?: number
    availability?: string | string[]
    minRating?: number
    sortBy?: 'price' | 'rating' | 'createdAt' | 'title'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) {
    try {
      const {
        category,
        search,
        minPrice,
        maxPrice,
        availability,
        minRating,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = options || {}

      const where: Prisma.ProductWhereInput = {}

      if (category && category !== 'All') {
        where.category = category
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }
        ]
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {}
        if (minPrice !== undefined) where.price.gte = minPrice
        if (maxPrice !== undefined) where.price.lte = maxPrice
      }

      if (availability) {
        if (Array.isArray(availability)) {
          where.availability = { in: availability }
        } else {
          where.availability = availability
        }
      }

      if (minRating !== undefined) {
        where.rating = { gte: minRating }
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            reviews: {
              include: {
                user: {
                  select: { id: true, name: true, image: true }
                }
              }
            },
            _count: {
              select: { reviews: true }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.product.count({ where })
      ])

      return {
        products,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error}`)
    }
  },

  // READ - Get single product by ID
  async getById(id: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          reviews: {
            include: {
              user: {
                select: { id: true, name: true, image: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: { reviews: true }
          }
        }
      })

      if (!product) {
        throw new Error('Product not found')
      }

      return product
    } catch (error) {
      throw new Error(`Failed to fetch product: ${error}`)
    }
  },

  // READ - Get related products
  async getRelated(productId: string, limit: number = 4) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { category: true, tags: true }
      })

      if (!product) {
        throw new Error('Product not found')
      }

      return await prisma.product.findMany({
        where: {
          AND: [
            { id: { not: productId } },
            {
              OR: [
                { category: product.category },
                { tags: { hasSome: product.tags } }
              ]
            }
          ]
        },
        include: {
          _count: {
            select: { reviews: true }
          }
        },
        take: limit,
        orderBy: { rating: 'desc' }
      })
    } catch (error) {
      throw new Error(`Failed to fetch related products: ${error}`)
    }
  },

  // READ - Get featured products
  async getFeatured(limit: number = 6) {
    try {
      return await prisma.product.findMany({
        where: {
          rating: { gte: 4.5 },
          availability: 'in-stock'
        },
        include: {
          _count: {
            select: { reviews: true }
          }
        },
        orderBy: [
          { rating: 'desc' },
          { reviewCount: 'desc' }
        ],
        take: limit
      })
    } catch (error) {
      throw new Error(`Failed to fetch featured products: ${error}`)
    }
  },

  // UPDATE
  async update(id: string, data: Partial<Omit<Prisma.ProductUpdateInput, 'id' | 'createdAt'>>) {
    try {
      return await prisma.product.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          reviews: {
            include: {
              user: {
                select: { id: true, name: true, image: true }
              }
            }
          },
          _count: {
            select: { reviews: true }
          }
        }
      })
    } catch (error) {
      throw new Error(`Failed to update product: ${error}`)
    }
  },

  // UPDATE - Update stock/availability
  async updateStock(id: string, availability: string) {
    try {
      return await prisma.product.update({
        where: { id },
        data: { availability },
        select: { id: true, title: true, availability: true }
      })
    } catch (error) {
      throw new Error(`Failed to update product stock: ${error}`)
    }
  },

  // DELETE - Cascade delete product and all related data
  async delete(id: string) {
    try {
      // With cascade deletes in schema, we can simply delete the product
      // and all related data will be automatically deleted
      return await prisma.product.delete({
        where: { id }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Product not found')
        }
      }
      throw new Error(`Failed to delete product: ${error}`)
    }
  },

  // DELETE - Soft delete (mark as unavailable) product instead of hard delete
  async softDelete(id: string) {
    try {
      return await prisma.product.update({
        where: { id },
        data: { 
          availability: 'discontinued'
        },
        select: {
          id: true,
          title: true,
          availability: true
        }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Product not found')
        }
      }
      throw new Error(`Failed to soft delete product: ${error}`)
    }
  },

  // UTILITY - Get categories
  async getCategories() {
    try {
      const categories = await prisma.product.findMany({
        select: { category: true },
        distinct: ['category']
      })
      return ['All', ...categories.map(c => c.category)]
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error}`)
    }
  },

  // UTILITY - Get price range
  async getPriceRange() {
    try {
      const result = await prisma.product.aggregate({
        _min: { price: true },
        _max: { price: true }
      })
      return {
        min: result._min.price || 0,
        max: result._max.price || 1000
      }
    } catch (error) {
      throw new Error(`Failed to fetch price range: ${error}`)
    }
  },

  // UTILITY - Search suggestions
  async getSearchSuggestions(query: string, limit: number = 5) {
    try {
      return await prisma.product.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } }
          ]
        },
        select: { id: true, title: true, category: true },
        take: limit
      })
    } catch (error) {
      throw new Error(`Failed to fetch search suggestions: ${error}`)
    }
  }
}