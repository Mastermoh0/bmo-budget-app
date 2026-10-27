import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Move category to a different group
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { categoryId, targetGroupId } = body

    if (!categoryId || !targetGroupId) {
      return NextResponse.json(
        { error: 'categoryId and targetGroupId are required' }, 
        { status: 400 }
      )
    }

    // Verify the category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { categoryGroup: true }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' }, 
        { status: 404 }
      )
    }

    // Verify the target group exists
    const targetGroup = await prisma.categoryGroup.findUnique({
      where: { id: targetGroupId }
    })

    if (!targetGroup) {
      return NextResponse.json(
        { error: 'Target group not found' }, 
        { status: 404 }
      )
    }

    // Get the highest sort order in the target group
    const lastCategoryInTargetGroup = await prisma.category.findFirst({
      where: { categoryGroupId: targetGroupId },
      orderBy: { sortOrder: 'desc' },
    })

    const newSortOrder = lastCategoryInTargetGroup 
      ? lastCategoryInTargetGroup.sortOrder + 1 
      : 1

    // Update the category's group and sort order
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        categoryGroupId: targetGroupId,
        sortOrder: newSortOrder
      },
      include: {
        categoryGroup: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      category: updatedCategory,
      message: `Category "${category.name}" moved to "${targetGroup.name}"`
    })
  } catch (error) {
    console.error('Failed to move category:', error)
    return NextResponse.json(
      { error: 'Failed to move category' }, 
      { status: 500 }
    )
  }
} 