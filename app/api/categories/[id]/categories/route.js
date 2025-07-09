import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Create new category in a specific group
export async function POST(request, { params }) {
  try {
    const { id: groupId } = params
    const body = await request.json()
    const { name } = body

    // Get the highest sort order for categories in this group
    const lastCategory = await prisma.category.findFirst({
      where: { categoryGroupId: groupId },
      orderBy: { sortOrder: 'desc' },
    })

    const sortOrder = lastCategory ? lastCategory.sortOrder + 1 : 1

    const category = await prisma.category.create({
      data: {
        name,
        categoryGroupId: groupId,
        sortOrder,
      },
    })

    // Return category with default budget values to prevent NaN issues
    const categoryWithDefaults = {
      ...category,
      budgeted: 0,
      activity: 0,
      available: 0
    }

    return NextResponse.json(categoryWithDefaults, { status: 201 })
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
} 