import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { reviewOperations } from "@/lib/db"

// GET /api/reviews/[id] - Get a specific review
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await reviewOperations.getById(params.id)
    return NextResponse.json(review)
  } catch (error) {
    console.error("Error fetching review:", error)
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    )
  }
}

// PUT /api/reviews/[id] - Update a review
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check if the review belongs to the current user
    const existingReview = await reviewOperations.getById(params.id)
    
    if (existingReview.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You can only edit your own reviews" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { rating, comment } = body

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    const updatedReview = await reviewOperations.update(params.id, {
      rating: rating ? parseInt(rating) : undefined,
      comment: comment?.trim()
    })

    return NextResponse.json(updatedReview)
  } catch (error) {
    console.error("Error updating review:", error)
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id] - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check if the review belongs to the current user or user is admin
    const existingReview = await reviewOperations.getById(params.id)
    
    if (existingReview.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You can only delete your own reviews" },
        { status: 403 }
      )
    }

    await reviewOperations.delete(params.id)

    return NextResponse.json({ message: "Review deleted successfully" })
  } catch (error) {
    console.error("Error deleting review:", error)
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    )
  }
}