import { NextRequest, NextResponse } from 'next/server'
import { productOperations } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '8')
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const availability = searchParams.get('availability')?.split(',').filter(Boolean) || undefined
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined
    const sortBy = searchParams.get('sortBy') as 'price' | 'rating' | 'createdAt' | 'title' || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc'

    const result = await productOperations.getAll({
      page,
      limit,
      category,
      search,
      minPrice,
      maxPrice,
      availability,
      minRating,
      sortBy,
      sortOrder
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Products API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const product = await productOperations.create(body)

    return NextResponse.json({
      success: true,
      data: product
    }, { status: 201 })
  } catch (error) {
    console.error('Create Product API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create product',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}