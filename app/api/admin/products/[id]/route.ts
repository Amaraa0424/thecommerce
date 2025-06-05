import { NextRequest, NextResponse } from "next/server"
import { productOperations } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, subtitle, description, price, category, imageUrl, stock, availability } = body
    const productId = params.id

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

    const updateData = {
      title: title.trim(),
      subtitle: subtitle?.trim() || "", // Required field, use empty string if not provided
      description: description.trim(),
      price: parsedPrice,
      category,
      images: imageUrl ? [imageUrl] : ["/placeholder.jpg"], // Convert single image to array
      availability: availability || "in-stock",
    }

    const result = await productOperations.update(productId, updateData)

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: result
    })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update product" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id

    const result = await productOperations.delete(productId)

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete product" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id

    const result = await productOperations.getById(productId)

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 }
    )
  }
}