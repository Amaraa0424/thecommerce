import { NextRequest, NextResponse } from 'next/server'
import { productOperations } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '4')

    const relatedProducts = await productOperations.getRelated(params.id, limit)

    return NextResponse.json({
      success: true,
      data: relatedProducts
    })
  } catch (error) {
    console.error('Related Products API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch related products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: error instanceof Error && error.message === 'Product not found' ? 404 : 500 }
    )
  }
}