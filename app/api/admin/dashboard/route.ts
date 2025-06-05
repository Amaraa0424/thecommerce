import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET - Fetch dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get overview statistics
    const [totalUsers, totalOrders, totalProducts, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.product.count(),
      prisma.order.aggregate({
        _sum: {
          total: true
        }
      })
    ])

    // Get recent orders for activity
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Get monthly sales data (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlySales = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    })

    // Process monthly sales data
    const salesData = monthlySales.reduce((acc: any[], order) => {
      const month = new Date(order.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
      
      const existing = acc.find(item => item.month === month)
      if (existing) {
        existing.revenue += order._sum.total || 0
        existing.orders += order._count.id
      } else {
        acc.push({
          month,
          revenue: order._sum.total || 0,
          orders: order._count.id
        })
      }
      
      return acc
    }, [])

    // Format recent activity
    const recentActivity = recentOrders.map(order => ({
      message: `New order from ${order.customer?.name || order.customerEmail}`,
      amount: order.total,
      time: order.createdAt,
      status: order.status
    }))

    const overview = {
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue: totalRevenue._sum.total || 0,
      revenueGrowth: "+0%", // You can implement growth calculation here
      orderGrowth: "+0%"    // You can implement growth calculation here
    }

    return NextResponse.json({
      success: true,
      data: {
        overview,
        salesData,
        recentActivity
      }
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}