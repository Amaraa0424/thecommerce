import { prisma } from './client'
import type { Order } from '@prisma/client'
import { Prisma } from '@prisma/client'

// Order CRUD Operations
export const orderOperations = {
  // CREATE
  async create(data: {
    customerId: string
    customerName: string
    customerEmail: string
    items: Array<{
      productId: string
      productTitle: string
      quantity: number
      price: number
      image: string
    }>
    total: number
    shippingAddress: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
  }) {
    try {
      // Create shipping address first
      const shippingAddress = await prisma.shippingAddress.create({
        data: {
          ...data.shippingAddress,
          orderId: '' // Will be updated after order creation
        }
      })

      // Create the order
      const order = await prisma.order.create({
        data: {
          customerId: data.customerId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          total: data.total,
          status: 'PENDING',
          shippingAddressId: shippingAddress.id
        }
      })

      // Update shipping address with order ID
      await prisma.shippingAddress.update({
        where: { id: shippingAddress.id },
        data: { orderId: order.id }
      })

      // Create order items
      const orderItems = await Promise.all(
        data.items.map(item =>
          prisma.orderItem.create({
            data: {
              ...item,
              orderId: order.id
            }
          })
        )
      )

      // Return complete order with relations
      return await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, title: true, images: true, availability: true }
              }
            }
          },
          shippingAddress: true,
          customer: {
            select: { id: true, name: true, email: true, image: true }
          }
        }
      })
    } catch (error) {
      throw new Error(`Failed to create order: ${error}`)
    }
  },

  // READ - Get all orders with filters
  async getAll(options?: {
    customerId?: string
    status?: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
    dateFrom?: Date
    dateTo?: Date
    search?: string
    sortBy?: 'createdAt' | 'total' | 'status'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) {
    try {
      const {
        customerId,
        status,
        dateFrom,
        dateTo,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = options || {}

      const where: Prisma.OrderWhereInput = {}

      if (customerId) where.customerId = customerId
      if (status) where.status = status

      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) where.createdAt.gte = dateFrom
        if (dateTo) where.createdAt.lte = dateTo
      }

      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } }
        ]
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, title: true, images: true }
                }
              }
            },
            shippingAddress: true,
            customer: {
              select: { id: true, name: true, email: true, image: true }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.order.count({ where })
      ])

      return {
        orders,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      throw new Error(`Failed to fetch orders: ${error}`)
    }
  },

  // READ - Get single order by ID
  async getById(id: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, title: true, images: true, availability: true }
              }
            }
          },
          shippingAddress: true,
          customer: {
            select: { id: true, name: true, email: true, image: true }
          }
        }
      })

      if (!order) {
        throw new Error('Order not found')
      }

      return order
    } catch (error) {
      throw new Error(`Failed to fetch order: ${error}`)
    }
  },

  // READ - Get user orders
  async getUserOrders(userId: string, options?: {
    status?: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
    page?: number
    limit?: number
  }) {
    try {
      const { status, page = 1, limit = 10 } = options || {}

      const where: Prisma.OrderWhereInput = { customerId: userId }
      if (status) where.status = status

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
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
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.order.count({ where })
      ])

      return {
        orders,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      throw new Error(`Failed to fetch user orders: ${error}`)
    }
  },

  // UPDATE - Update order status
  async updateStatus(id: string, status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED') {
    try {
      return await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, title: true, images: true }
              }
            }
          },
          shippingAddress: true,
          customer: {
            select: { id: true, name: true, email: true }
          }
        }
      })
    } catch (error) {
      throw new Error(`Failed to update order status: ${error}`)
    }
  },

  // UPDATE - Update shipping address
  async updateShippingAddress(orderId: string, address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { shippingAddressId: true }
      })

      if (!order) {
        throw new Error('Order not found')
      }

      return await prisma.shippingAddress.update({
        where: { id: order.shippingAddressId },
        data: address
      })
    } catch (error) {
      throw new Error(`Failed to update shipping address: ${error}`)
    }
  },

  // DELETE - Cascade delete order and all related data
  async delete(id: string) {
    try {
      // With cascade deletes in schema, we can simply delete the order
      // and all related data (order items, shipping address) will be automatically deleted
      return await prisma.order.delete({
        where: { id }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Order not found')
        }
      }
      throw new Error(`Failed to delete order: ${error}`)
    }
  },

  // DELETE - Cancel order instead of hard delete (recommended for business records)
  async cancel(id: string, reason?: string) {
    try {
      return await prisma.order.update({
        where: { id },
        data: { 
          status: 'CANCELLED'
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, title: true, images: true }
              }
            }
          },
          shippingAddress: true,
          customer: {
            select: { id: true, name: true, email: true }
          }
        }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Order not found')
        }
      }
      throw new Error(`Failed to cancel order: ${error}`)
    }
  },

  // UTILITY - Get order statistics
  async getStats(options?: {
    customerId?: string
    dateFrom?: Date
    dateTo?: Date
  }) {
    try {
      const { customerId, dateFrom, dateTo } = options || {}

      const where: Prisma.OrderWhereInput = {}
      if (customerId) where.customerId = customerId
      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) where.createdAt.gte = dateFrom
        if (dateTo) where.createdAt.lte = dateTo
      }

      const [
        totalOrders,
        pendingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue
      ] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.count({ where: { ...where, status: 'PENDING' } }),
        prisma.order.count({ where: { ...where, status: 'SHIPPED' } }),
        prisma.order.count({ where: { ...where, status: 'DELIVERED' } }),
        prisma.order.count({ where: { ...where, status: 'CANCELLED' } }),
        prisma.order.aggregate({
          where: { ...where, status: { not: 'CANCELLED' } },
          _sum: { total: true }
        })
      ])

      return {
        total: totalOrders,
        pending: pendingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        revenue: totalRevenue._sum.total || 0
      }
    } catch (error) {
      throw new Error(`Failed to fetch order statistics: ${error}`)
    }
  },

  // UTILITY - Get recent orders
  async getRecent(limit: number = 5) {
    try {
      return await prisma.order.findMany({
        include: {
          items: {
            include: {
              product: {
                select: { id: true, title: true, images: true }
              }
            }
          },
          customer: {
            select: { id: true, name: true, email: true, image: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      throw new Error(`Failed to fetch recent orders: ${error}`)
    }
  }
}