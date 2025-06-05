import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { orderOperations } from "@/lib/db"
import { rateLimiters, getRateLimitHeaders } from "@/lib/rate-limit"
import { logger } from "@/lib/security"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// POST /api/orders - Create a new order (checkout)
export async function POST(request: NextRequest) {
  let session: any = null
  
  try {
    session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Apply rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = rateLimiters.orders(`${session.user.id}-${clientIP}`)
    
    if (!rateLimitResult.allowed) {
      const headers = getRateLimitHeaders(rateLimitResult)
      return NextResponse.json(
        { error: "Too many orders, please wait before placing another order" },
        { status: 429, headers }
      )
    }

    const body = await request.json()
    const { 
      items, 
      total, 
      shippingAddress,
      customerInfo 
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order items are required" },
        { status: 400 }
      )
    }

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: "Valid order total is required" },
        { status: 400 }
      )
    }

    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city) {
      return NextResponse.json(
        { error: "Complete shipping address is required" },
        { status: 400 }
      )
    }

    // Validate order items format
    for (const item of items) {
      if (!item.productId || !item.productTitle || !item.quantity || !item.price || !item.image) {
        return NextResponse.json(
          { error: "Invalid order item format" },
          { status: 400 }
        )
      }
    }

    // Create the order
    const order = await orderOperations.create({
      customerId: session.user.id,
      customerName: customerInfo?.name || session.user.name || "Customer",
      customerEmail: customerInfo?.email || session.user.email || "",
      items: items.map(item => ({
        productId: item.productId,
        productTitle: item.productTitle,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        image: item.image
      })),
      total: parseFloat(total),
      shippingAddress: {
        street: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state || "",
        zipCode: shippingAddress.zipCode || "",
        country: shippingAddress.country || "United States"
      }
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order?.id,
        total: order?.total,
        status: order?.status,
        createdAt: order?.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    logger.error("Error creating order", error, { 
      userId: session?.user?.id,
      userAgent: request.headers.get('user-agent')
    })
    
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  let session: any = null
  
  try {
    session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | undefined
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    const result = await orderOperations.getUserOrders(session.user.id, {
      status,
      page,
      limit
    })

    return NextResponse.json(result)

  } catch (error) {
    logger.error("Error fetching orders", error, { 
      userId: session?.user?.id 
    })
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}