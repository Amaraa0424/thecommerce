import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { categoryOperations } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const category = await categoryOperations.getById(params.id)

    return NextResponse.json({
      success: true,
      data: category
    })
  } catch (error) {
    console.error('Admin Category API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch category',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: error instanceof Error && error.message === 'Category not found' ? 404 : 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    const category = await categoryOperations.update(params.id, body)

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    })
  } catch (error) {
    console.error('Update Category API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update category',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: error instanceof Error && error.message === 'Category not found' ? 404 : 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    await categoryOperations.delete(params.id)

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Delete Category API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete category',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    )
  }
}