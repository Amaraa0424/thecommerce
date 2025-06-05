import { NextRequest, NextResponse } from 'next/server'
import { productOperations } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await productOperations.getById(params.id)

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Product API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch product',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: error instanceof Error && error.message === 'Product not found' ? 404 : 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const product = await productOperations.update(params.id, body)

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Update Product API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update product',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: error instanceof Error && error.message === 'Product not found' ? 404 : 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await productOperations.delete(params.id)

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Delete Product API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete product',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: error instanceof Error && error.message === 'Product not found' ? 404 : 500 }
    )
  }
}