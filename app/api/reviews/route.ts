import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { reviewOperations } from "@/lib/db"

// GET /api/reviews - Get all reviews with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const userId = searchParams.get("userId")
    const rating = searchParams.get("rating")
    const sortBy = searchParams.get("sortBy") as "createdAt" | "rating" | undefined
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | undefined
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    const result = await reviewOperations.getAll({
      productId: productId || undefined,
      userId: userId || undefined,
      rating: rating ? parseInt(rating) : undefined,
      sortBy,
      sortOrder,
      page,
      limit
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, rating, comment } = body

    // Validate required fields
    if (!productId || !rating || !comment) {
      return NextResponse.json(
        { error: "Product ID, rating, and comment are required" },
        { status: 400 }
      )
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    const review = await reviewOperations.create({
      productId,
      userId: session.user.id,
      userName: session.user.name || "Anonymous",
      rating: parseInt(rating),
      comment: comment.trim()
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error("Error creating review:", error)
    
    if (error instanceof Error && error.message.includes("already reviewed")) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    )
  }
}