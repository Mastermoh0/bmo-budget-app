import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Create new category in a specific group
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's budget group membership
    const userMembership = await prisma.groupMember.findFirst({
      where: { userId: session.user.id },
      include: { group: true }
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'No budget group found' }, { status: 404 })
    }

    // Check if user has permission to create categories (VIEWER role cannot modify)
    if (userMembership.role === 'VIEWER') {
      return NextResponse.json({ 
        error: 'Access denied. Viewers cannot create categories.',
        userRole: userMembership.role 
      }, { status: 403 })
    }

    const { id: groupId } = params
    const body = await request.json()
    const { name } = body

    // Verify the category group belongs to the user's budget group
    const categoryGroup = await prisma.categoryGroup.findFirst({
      where: { 
        id: groupId,
        groupId: userMembership.groupId
      }
    })

    if (!categoryGroup) {
      return NextResponse.json({ error: 'Category group not found or access denied' }, { status: 404 })
    }

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