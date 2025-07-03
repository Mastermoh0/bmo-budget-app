import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Update category name
export async function PUT(request, { params }) {
  try {
    const { categoryId } = params
    const body = await request.json()
    const { name } = body

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { name },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Failed to update category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// Delete category
export async function DELETE(request, { params }) {
  try {
    const { categoryId } = params

    // Delete the category (this will also cascade delete related budgets)
    await prisma.category.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
} 