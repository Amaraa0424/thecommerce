import { prisma } from './client'

// Analytics and Dashboard Operations
export const analyticsOperations = {
  // Dashboard Overview
  async getDashboardStats() {
    try {
      // Get current date and calculate date ranges
      const now = new Date()
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const last6Months = new Date(now.getFullYear(), now.getMonth() - 6, 1)

      const [
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue,
        currentMonthOrders,
        lastMonthOrders,
        recentOrders,
        monthlySales
      ] = await Promise.all([
        prisma.product.count(),
        prisma.user.count(),
        prisma.order.count(),
        prisma.order.aggregate({
          where: { status: { not: 'CANCELLED' } },
          _sum: { total: true }
        }),
        // Current month orders
        prisma.order.aggregate({
          where: {
            createdAt: { gte: currentMonth },
            status: { not: 'CANCELLED' }
          },
          _count: true,
          _sum: { total: true }
        }),
        // Last month orders
        prisma.order.aggregate({
          where: {
            createdAt: { gte: lastMonth, lt: currentMonth },
            status: { not: 'CANCELLED' }
          },
          _count: true,
          _sum: { total: true }
        }),
        // Recent orders for activity
        prisma.order.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
            customerName: true,
            customerEmail: true
          }
        }),
        // Get monthly sales for the last 6 months
        this.getMonthlySalesData(last6Months)
      ])

      // Calculate growth percentages
      const orderGrowth = lastMonthOrders._count > 0 
        ? ((currentMonthOrders._count - lastMonthOrders._count) / lastMonthOrders._count * 100).toFixed(1)
        : "0"
      
      const revenueGrowth = (lastMonthOrders._sum.total || 0) > 0
        ? (((currentMonthOrders._sum.total || 0) - (lastMonthOrders._sum.total || 0)) / (lastMonthOrders._sum.total || 1) * 100).toFixed(1)
        : "0"

      // Format recent activity
      const recentActivity = recentOrders.map(order => ({
        id: order.id,
        message: `New order #${order.id.slice(-8)} from ${order.customerName}`,
        amount: order.total,
        status: order.status,
        time: order.createdAt
      }))

      return {
        overview: {
          totalProducts,
          totalUsers,
          totalOrders,
          totalRevenue: totalRevenue._sum.total || 0,
          currentMonthOrders: currentMonthOrders._count,
          currentMonthRevenue: currentMonthOrders._sum.total || 0,
          orderGrowth: `${parseFloat(orderGrowth) >= 0 ? '+' : ''}${orderGrowth}%`,
          revenueGrowth: `${parseFloat(revenueGrowth) >= 0 ? '+' : ''}${revenueGrowth}%`
        },
        recentOrders,
        recentActivity,
        salesData: monthlySales
      }
    } catch (error) {
      throw new Error(`Failed to fetch dashboard stats: ${error}`)
    }
  },

  // Helper method to get monthly sales data
  async getMonthlySalesData(fromDate: Date) {
    try {
      // Get orders grouped by month
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: fromDate },
          status: { not: 'CANCELLED' }
        },
        select: {
          createdAt: true,
          total: true
        }
      })

      // Group by month
      const monthlyData = new Map()
      
      orders.forEach(order => {
        const monthKey = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`
        const existing = monthlyData.get(monthKey) || { orders: 0, revenue: 0 }
        monthlyData.set(monthKey, {
          orders: existing.orders + 1,
          revenue: existing.revenue + order.total
        })
      })

      // Convert to array and format
      const result = []
      const now = new Date()
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const data = monthlyData.get(monthKey) || { orders: 0, revenue: 0 }
        
        result.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          orders: data.orders,
          revenue: Math.round(data.revenue * 100) / 100
        })
      }

      return result
    } catch (error) {
      throw new Error(`Failed to fetch monthly sales data: ${error}`)
    }
  },

  // Sales Analytics
  async getSalesAnalytics(options?: {
    dateFrom?: Date
    dateTo?: Date
    groupBy?: 'day' | 'week' | 'month'
  }) {
    try {
      const { dateFrom, dateTo, groupBy = 'day' } = options || {}

      const where: any = {}
      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) where.createdAt.gte = dateFrom
        if (dateTo) where.createdAt.lte = dateTo
      }

      const [salesByPeriod, salesByCategory, topSellingProducts] = await Promise.all([
        // Sales over time (simplified - you might want to use raw SQL for complex date grouping)
        prisma.order.groupBy({
          by: ['createdAt'],
          where,
          _sum: { total: true },
          _count: { id: true },
          orderBy: { createdAt: 'asc' }
        }),
        
        // Sales by category
        prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: where
          },
          _sum: { price: true },
          _count: { id: true }
        }).then(async (items) => {
          const productIds = items.map(item => item.productId)
          const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, category: true }
          })
          
          const categoryMap = new Map()
          products.forEach(product => {
            categoryMap.set(product.id, product.category)
          })
          
          const categoryStats = new Map()
          items.forEach(item => {
            const category = categoryMap.get(item.productId) || 'Unknown'
            const existing = categoryStats.get(category) || { revenue: 0, orders: 0 }
            categoryStats.set(category, {
              revenue: existing.revenue + (item._sum.price || 0),
              orders: existing.orders + item._count.id
            })
          })
          
          return Array.from(categoryStats.entries()).map(([category, stats]) => ({
            category,
            ...stats
          }))
        }),

        // Top selling products
        prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: where
          },
          _sum: { quantity: true, price: true },
          _count: { id: true },
          orderBy: {
            _sum: { quantity: 'desc' }
          },
          take: 10
        }).then(async (items) => {
          const productIds = items.map(item => item.productId)
          const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, title: true, images: true }
          })
          
          return items.map(item => {
            const product = products.find(p => p.id === item.productId)
            return {
              product,
              quantitySold: item._sum.quantity || 0,
              revenue: item._sum.price || 0,
              orderCount: item._count.id
            }
          })
        })
      ])

      return {
        salesByPeriod,
        salesByCategory,
        topSellingProducts
      }
    } catch (error) {
      throw new Error(`Failed to fetch sales analytics: ${error}`)
    }
  },

  // User Analytics
  async getUserAnalytics() {
    try {
      const [
        userGrowth,
        usersByRole,
        usersByStatus,
        topCustomers
      ] = await Promise.all([
        // User registration over time (last 30 days)
        prisma.user.groupBy({
          by: ['createdAt'],
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          _count: { id: true },
          orderBy: { createdAt: 'asc' }
        }),

        // Users by role
        prisma.user.groupBy({
          by: ['role'],
          _count: { role: true }
        }),

        // Users by status
        prisma.user.groupBy({
          by: ['status'],
          _count: { status: true }
        }),

        // Top customers by order value
        prisma.user.findMany({
          where: { role: 'CUSTOMER' },
          include: {
            orders: {
              where: { status: { not: 'CANCELLED' } },
              select: { total: true }
            }
          },
          take: 10
        }).then(async users => {
          const usersWithStats = await Promise.all(
            users.map(async user => {
              const orderCount = await prisma.order.count({
                where: { customerId: user.id }
              })
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                totalSpent: user.orders.reduce((sum, order) => sum + order.total, 0),
                orderCount
              }
            })
          )
          return usersWithStats.sort((a, b) => b.totalSpent - a.totalSpent)
        })
      ])

      return {
        userGrowth,
        usersByRole: usersByRole.map(item => ({
          role: item.role,
          count: item._count.role
        })),
        usersByStatus: usersByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        topCustomers
      }
    } catch (error) {
      throw new Error(`Failed to fetch user analytics: ${error}`)
    }
  },

  // Product Analytics
  async getProductAnalytics() {
    try {
      const [
        productsByCategory,
        productsByAvailability,
        topRatedProducts,
        lowStockProducts,
        productPerformance
      ] = await Promise.all([
        // Products by category
        prisma.product.groupBy({
          by: ['category'],
          _count: { category: true },
          _avg: { price: true, rating: true }
        }),

        // Products by availability
        prisma.product.groupBy({
          by: ['availability'],
          _count: { availability: true }
        }),

        // Top rated products
        prisma.product.findMany({
          where: { reviewCount: { gt: 0 } },
          orderBy: [
            { rating: 'desc' },
            { reviewCount: 'desc' }
          ],
          take: 10,
          select: {
            id: true,
            title: true,
            rating: true,
            reviewCount: true,
            images: true
          }
        }),

        // Low stock products
        prisma.product.findMany({
          where: { availability: 'limited' },
          select: {
            id: true,
            title: true,
            availability: true,
            category: true
          }
        }),

        // Product performance (sales data)
        prisma.orderItem.groupBy({
          by: ['productId'],
          _sum: { quantity: true, price: true },
          _count: { id: true },
          orderBy: {
            _sum: { price: 'desc' }
          },
          take: 20
        }).then(async (items) => {
          const productIds = items.map(item => item.productId)
          const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, title: true, price: true, category: true }
          })
          
          return items.map(item => {
            const product = products.find(p => p.id === item.productId)
            return {
              product,
              totalSold: item._sum.quantity || 0,
              totalRevenue: item._sum.price || 0,
              orderCount: item._count.id
            }
          })
        })
      ])

      return {
        productsByCategory: productsByCategory.map(item => ({
          category: item.category,
          count: item._count.category,
          averagePrice: Math.round((item._avg.price || 0) * 100) / 100,
          averageRating: Math.round((item._avg.rating || 0) * 10) / 10
        })),
        productsByAvailability: productsByAvailability.map(item => ({
          availability: item.availability,
          count: item._count.availability
        })),
        topRatedProducts,
        lowStockProducts,
        productPerformance
      }
    } catch (error) {
      throw new Error(`Failed to fetch product analytics: ${error}`)
    }
  },

  // Order Analytics
  async getOrderAnalytics(options?: {
    dateFrom?: Date
    dateTo?: Date
  }) {
    try {
      const { dateFrom, dateTo } = options || {}

      const where: any = {}
      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) where.createdAt.gte = dateFrom
        if (dateTo) where.createdAt.lte = dateTo
      }

      const [
        ordersByStatus,
        orderTrends,
        averageOrderValue,
        ordersByCustomer
      ] = await Promise.all([
        // Orders by status
        prisma.order.groupBy({
          by: ['status'],
          where,
          _count: { status: true },
          _sum: { total: true }
        }),

        // Order trends (last 30 days)
        prisma.order.groupBy({
          by: ['createdAt'],
          where: {
            ...where,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          _count: { id: true },
          _sum: { total: true },
          orderBy: { createdAt: 'asc' }
        }),

        // Average order value
        prisma.order.aggregate({
          where,
          _avg: { total: true },
          _count: { id: true },
          _sum: { total: true }
        }),

        // Orders by customer (top customers)
        prisma.order.groupBy({
          by: ['customerId'],
          where,
          _count: { id: true },
          _sum: { total: true },
          orderBy: {
            _sum: { total: 'desc' }
          },
          take: 10
        }).then(async (orders) => {
          const customerIds = orders.map(order => order.customerId)
          const customers = await prisma.user.findMany({
            where: { id: { in: customerIds } },
            select: { id: true, name: true, email: true }
          })
          
          return orders.map(order => {
            const customer = customers.find(c => c.id === order.customerId)
            return {
              customer,
              orderCount: order._count.id,
              totalSpent: order._sum.total || 0
            }
          })
        })
      ])

      return {
        ordersByStatus: ordersByStatus.map(item => ({
          status: item.status,
          count: item._count.status,
          revenue: item._sum.total || 0
        })),
        orderTrends,
        averageOrderValue: {
          average: Math.round((averageOrderValue._avg.total || 0) * 100) / 100,
          total: averageOrderValue._sum.total || 0,
          count: averageOrderValue._count.id
        },
        ordersByCustomer
      }
    } catch (error) {
      throw new Error(`Failed to fetch order analytics: ${error}`)
    }
  }
}