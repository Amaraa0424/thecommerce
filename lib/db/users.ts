import { prisma } from './client'
import type { User } from '@prisma/client'
import { Prisma } from '@prisma/client'

// User CRUD Operations
export const userOperations = {
  // CREATE
  async create(data: Omit<Prisma.UserCreateInput, 'id' | 'createdAt'>) {
    try {
      return await prisma.user.create({
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          image: true,
          createdAt: true
        }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Email already exists')
        }
      }
      throw new Error(`Failed to create user: ${error}`)
    }
  },

  // READ - Get all users with filters
  async getAll(options?: {
    role?: 'ADMIN' | 'CUSTOMER'
    status?: 'ACTIVE' | 'INACTIVE'
    search?: string
    sortBy?: 'name' | 'email' | 'createdAt'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) {
    try {
      const {
        role,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = options || {}

      const where: Prisma.UserWhereInput = {}

      if (role) where.role = role
      if (status) where.status = status

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            image: true,
            createdAt: true,
            _count: {
              select: {
                orders: true,
                reviews: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.user.count({ where })
      ])

      return {
        users,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error}`)
    }
  },

  // READ - Get single user by ID
  async getById(id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          orders: {
            include: {
              items: {
                include: {
                  product: {
                    select: { id: true, title: true, images: true }
                  }
                }
              },
              shippingAddress: true
            },
            orderBy: { createdAt: 'desc' }
          },
          reviews: {
            include: {
              product: {
                select: { id: true, title: true, images: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              orders: true,
              reviews: true
            }
          }
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      return user
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error}`)
    }
  },

  // READ - Get user by email
  async getByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          image: true,
          createdAt: true
        }
      })
    } catch (error) {
      throw new Error(`Failed to fetch user by email: ${error}`)
    }
  },

  // READ - Get user profile (safe for frontend)
  async getProfile(id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              reviews: true
            }
          }
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      return user
    } catch (error) {
      throw new Error(`Failed to fetch user profile: ${error}`)
    }
  },

  // UPDATE
  async update(id: string, data: Partial<Omit<Prisma.UserUpdateInput, 'id' | 'createdAt'>>) {
    try {
      return await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          image: true,
          createdAt: true
        }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Email already exists')
        }
      }
      throw new Error(`Failed to update user: ${error}`)
    }
  },

  // UPDATE - Update user status
  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    try {
      return await prisma.user.update({
        where: { id },
        data: { status },
        select: { id: true, name: true, email: true, status: true }
      })
    } catch (error) {
      throw new Error(`Failed to update user status: ${error}`)
    }
  },

  // UPDATE - Update user role
  async updateRole(id: string, role: 'ADMIN' | 'CUSTOMER') {
    try {
      return await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, name: true, email: true, role: true }
      })
    } catch (error) {
      throw new Error(`Failed to update user role: ${error}`)
    }
  },

  // DELETE - Cascade delete user and all related data
  async delete(id: string) {
    try {
      // With cascade deletes in schema, we can simply delete the user
      // and all related data will be automatically deleted
      return await prisma.user.delete({
        where: { id }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('User not found')
        }
      }
      throw new Error(`Failed to delete user: ${error}`)
    }
  },

  // DELETE - Soft delete (deactivate) user instead of hard delete
  async softDelete(id: string) {
    try {
      return await prisma.user.update({
        where: { id },
        data: { 
          status: 'INACTIVE',
          email: `deleted_${Date.now()}_${id}@deleted.com` // Prevent email conflicts
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true
        }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('User not found')
        }
      }
      throw new Error(`Failed to soft delete user: ${error}`)
    }
  },

  // UTILITY - Get user statistics
  async getStats() {
    try {
      const [totalUsers, activeUsers, adminUsers, customerUsers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { role: 'CUSTOMER' } })
      ])

      return {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        admins: adminUsers,
        customers: customerUsers
      }
    } catch (error) {
      throw new Error(`Failed to fetch user statistics: ${error}`)
    }
  },

  // UTILITY - Check if email exists
  async emailExists(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      })
      return !!user
    } catch (error) {
      throw new Error(`Failed to check email existence: ${error}`)
    }
  }
}