import { prisma } from './client'
import type { Prisma } from '@prisma/client'

// Category CRUD Operations
export const categoryOperations = {
  // CREATE
  async create(data: Omit<Prisma.CategoryCreateInput, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      return await prisma.category.create({
        data
      })
    } catch (error) {
      throw new Error(`Failed to create category: ${error}`)
    }
  },

  // READ - Get all categories
  async getAll() {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ]
      })

      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const productCount = await prisma.product.count({
            where: { category: category.name }
          })
          return {
            ...category,
            productCount
          }
        })
      )

      // Add "All" category
      const totalProducts = await prisma.product.count()
      return [
        { 
          id: 'all', 
          name: 'All', 
          slug: 'all',
          description: 'All products',
          image: null,
          isActive: true,
          sortOrder: -1,
          productCount: totalProducts,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        ...categoriesWithCounts
      ]
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error}`)
    }
  },

  // READ - Get single category by ID
  async getById(id: string) {
    try {
      const category = await prisma.category.findUnique({
        where: { id }
      })

      if (!category) {
        throw new Error('Category not found')
      }

      return category
    } catch (error) {
      throw new Error(`Failed to fetch category: ${error}`)
    }
  },

  // READ - Get category by slug
  async getBySlug(slug: string) {
    try {
      const category = await prisma.category.findUnique({
        where: { slug }
      })

      if (!category) {
        throw new Error('Category not found')
      }

      return category
    } catch (error) {
      throw new Error(`Failed to fetch category: ${error}`)
    }
  },

  // UPDATE
  async update(id: string, data: Partial<Omit<Prisma.CategoryUpdateInput, 'id' | 'createdAt'>>) {
    try {
      return await prisma.category.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      throw new Error(`Failed to update category: ${error}`)
    }
  },

  // DELETE
  async delete(id: string) {
    try {
      // Check if category has products
      const productCount = await prisma.product.count({
        where: { category: { equals: id } }
      })

      if (productCount > 0) {
        throw new Error('Cannot delete category with existing products')
      }

      return await prisma.category.delete({
        where: { id }
      })
    } catch (error) {
      throw new Error(`Failed to delete category: ${error}`)
    }
  },

  // UTILITY - Get category statistics
  async getStats() {
    try {
      const categories = await prisma.product.groupBy({
        by: ['category'],
        _count: { category: true },
        _avg: { price: true, rating: true },
        _sum: { reviewCount: true }
      })

      return categories.map(cat => ({
        name: cat.category,
        productCount: cat._count.category,
        averagePrice: Math.round((cat._avg.price || 0) * 100) / 100,
        averageRating: Math.round((cat._avg.rating || 0) * 10) / 10,
        totalReviews: cat._sum.reviewCount || 0
      }))
    } catch (error) {
      throw new Error(`Failed to fetch category statistics: ${error}`)
    }
  },

  // UTILITY - Get products by category
  async getProducts(categoryName: string, options?: {
    sortBy?: 'price' | 'rating' | 'createdAt' | 'title'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) {
    try {
      const {
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = options || {}

      const where = categoryName === 'All' ? {} : { category: categoryName }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
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
      throw new Error(`Failed to fetch products by category: ${error}`)
    }
  }
}