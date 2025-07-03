import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Update category group name
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { name } = body

    const categoryGroup = await prisma.categoryGroup.update({
      where: { id },
      data: { name },
      include: {
        categories: {
          where: { isHidden: false },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return NextResponse.json(categoryGroup)
  } catch (error) {
    console.error('Failed to update category group:', error)
    return NextResponse.json({ error: 'Failed to update category group' }, { status: 500 })
  }
}

// Delete category group and all its categories
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Delete all categories in this group first (due to foreign key constraints)
    await prisma.category.deleteMany({
      where: { categoryGroupId: id }
    })

    // Then delete the category group
    await prisma.categoryGroup.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete category group:', error)
    return NextResponse.json({ error: 'Failed to delete category group' }, { status: 500 })
  }
} 