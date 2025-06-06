import { prisma } from './client'
import type { Product } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { safePrismaOperation } from './connection-wrapper'

// Product CRUD Operations
export const productOperations = {
  // CREATE
  async create(data: Omit<Prisma.ProductCreateInput, 'id' | 'createdAt' | 'updatedAt'>) {
    return safePrismaOperation(async () => {
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
    }, 'create product')
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
    return safePrismaOperation(async () => {
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
    }, 'fetch products')
  },

  // READ - Get single product by ID
  async getById(id: string) {
    return safePrismaOperation(async () => {
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
    }, 'fetch product by ID')
  },

  // READ - Get related products
  async getRelated(productId: string, limit: number = 4) {
    return safePrismaOperation(async () => {
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
    }, 'fetch related products')
  },

  // READ - Get featured products
  async getFeatured(limit: number = 6) {
    return safePrismaOperation(async () => {
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
    }, 'fetch featured products')
  },

  // UPDATE
  async update(id: string, data: Partial<Omit<Prisma.ProductUpdateInput, 'id' | 'createdAt'>>) {
    return safePrismaOperation(async () => {
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
    }, 'update product')
  },

  // UPDATE - Update stock/availability
  async updateStock(id: string, availability: string) {
    return safePrismaOperation(async () => {
      return await prisma.product.update({
        where: { id },
        data: { availability },
        select: { id: true, title: true, availability: true }
      })
    }, 'update product stock')
  },

  // DELETE - Cascade delete product and all related data
  async delete(id: string) {
    return safePrismaOperation(async () => {
      return await prisma.product.delete({
        where: { id }
      })
    }, 'delete product')
  },

  // DELETE - Soft delete (mark as unavailable) product instead of hard delete
  async softDelete(id: string) {
    return safePrismaOperation(async () => {
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
    }, 'soft delete product')
  },

  // UTILITY - Get categories
  async getCategories() {
    return safePrismaOperation(async () => {
      const categories = await prisma.product.findMany({
        select: { category: true },
        distinct: ['category']
      })
      return ['All', ...categories.map(c => c.category)]
    }, 'fetch categories')
  },

  // UTILITY - Get price range
  async getPriceRange() {
    return safePrismaOperation(async () => {
      const result = await prisma.product.aggregate({
        _min: { price: true },
        _max: { price: true }
      })
      return {
        min: result._min.price || 0,
        max: result._max.price || 1000
      }
    }, 'fetch price range')
  },

  // UTILITY - Search suggestions
  async getSearchSuggestions(query: string, limit: number = 5) {
    return safePrismaOperation(async () => {
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
    }, 'fetch search suggestions')
  }
}