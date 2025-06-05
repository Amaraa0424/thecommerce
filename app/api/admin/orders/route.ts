import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { customerId, customerName, customerEmail, items, shippingAddress, status = "PENDING" } = body

    if (!customerId || !customerName || !customerEmail || !items || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculate total
    const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)

    // Create order with shipping address and items using transaction
    const order = await prisma.$transaction(async (tx) => {
      // First create the shipping address
      const newShippingAddress = await tx.shippingAddress.create({
        data: {
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country,
          orderId: "temp" // Temporary value, will be updated
        }
      })

      // Create the order with the shipping address ID
      const newOrder = await tx.order.create({
        data: {
          customerId,
          customerName,
          customerEmail,
          total,
          status: status as "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED",
          shippingAddressId: newShippingAddress.id
        }
      })

      // Update the shipping address with the correct order ID
      await tx.shippingAddress.update({
        where: { id: newShippingAddress.id },
        data: { orderId: newOrder.id }
      })

      // Create order items
      await tx.orderItem.createMany({
        data: items.map((item: any) => ({
          orderId: newOrder.id,
          productId: item.productId,
          productTitle: item.productTitle,
          quantity: item.quantity,
          price: item.price,
          image: item.image
        }))
      })

      // Return the complete order with all relations
      return await tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true
                }
              }
            }
          },
          shippingAddress: true
        }
      })
    })

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Fetch all orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } }
      ]
    }
    
    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true
                }
              }
            }
          },
          shippingAddress: true
        }
      }),
      prisma.order.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}