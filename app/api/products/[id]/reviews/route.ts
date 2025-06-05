import { NextRequest, NextResponse } from "next/server"
import { reviewOperations } from "@/lib/db"

// GET /api/products/[id]/reviews - Get reviews for a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const rating = searchParams.get("rating")
    const sortBy = searchParams.get("sortBy") as "createdAt" | "rating" | undefined
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | undefined
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    const result = await reviewOperations.getProductReviews(params.id, {
      rating: rating ? parseInt(rating) : undefined,
      sortBy,
      sortOrder,
      page,
      limit
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching product reviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch product reviews" },
      { status: 500 }
    )
  }
}