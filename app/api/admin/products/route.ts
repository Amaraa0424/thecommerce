import { NextRequest, NextResponse } from "next/server"
import { productOperations } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, subtitle, description, price, category, imageUrl, stock, availability } = body

    // Validate required fields
    if (!title || !description || !price || !category) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Additional validation
    if (title.length < 3 || title.length > 100) {
      return NextResponse.json(
        { success: false, message: "Title must be between 3 and 100 characters" },
        { status: 400 }
      )
    }

    if (subtitle && subtitle.length > 150) {
      return NextResponse.json(
        { success: false, message: "Subtitle must be less than 150 characters" },
        { status: 400 }
      )
    }

    if (description.length < 10 || description.length > 1000) {
      return NextResponse.json(
        { success: false, message: "Description must be between 10 and 1000 characters" },
        { status: 400 }
      )
    }

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json(
        { success: false, message: "Price must be a positive number" },
        { status: 400 }
      )
    }

    const parsedStock = parseInt(stock)
    if (isNaN(parsedStock) || parsedStock < 0) {
      return NextResponse.json(
        { success: false, message: "Stock must be a non-negative number" },
        { status: 400 }
      )
    }

    const productData = {
      title: title.trim(),
      subtitle: subtitle?.trim() || "", // Required field, use empty string if not provided
      description: description.trim(),
      price: parsedPrice,
      category,
      images: imageUrl ? [imageUrl] : ["/placeholder.jpg"], // Convert single image to array
      availability: availability || "in-stock",
      rating: 0, // Default rating for new products
      reviewCount: 0, // Default review count for new products
      tags: [], // Default empty tags array
    }

    const result = await productOperations.create(productData)

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      data: result
    })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create product" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    const result = await productOperations.getAll({
      page,
      limit,
      sortBy: "createdAt",
      sortOrder: "desc"
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    )
  }
}