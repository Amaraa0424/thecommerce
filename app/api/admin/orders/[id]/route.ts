import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"

// GET - Fetch single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
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
                price: true,
                images: true
              }
            }
          }
        },
        shippingAddress: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: status as "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
      },
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

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Delete order (this will cascade delete order items due to foreign key constraints)
    await prisma.order.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}