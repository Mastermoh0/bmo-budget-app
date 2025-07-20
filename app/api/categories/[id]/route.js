import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Update category group name
export async function PUT(request, { params }) {
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

    // Check if user has permission to modify category groups (VIEWER role cannot modify)
    if (userMembership.role === 'VIEWER') {
      return NextResponse.json({ 
        error: 'Access denied. Viewers cannot modify category groups.',
        userRole: userMembership.role 
      }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const { name } = body

    // Verify the category group belongs to the user's budget group
    const categoryGroup = await prisma.categoryGroup.findFirst({
      where: { 
        id,
        groupId: userMembership.groupId
      }
    })

    if (!categoryGroup) {
      return NextResponse.json({ error: 'Category group not found or access denied' }, { status: 404 })
    }

    const updatedCategoryGroup = await prisma.categoryGroup.update({
      where: { id },
      data: { name },
      include: {
        categories: {
          where: { isHidden: false },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return NextResponse.json(updatedCategoryGroup)
  } catch (error) {
    console.error('Failed to update category group:', error)
    return NextResponse.json({ error: 'Failed to update category group' }, { status: 500 })
  }
}

// Delete category group and all its categories
export async function DELETE(request, { params }) {
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

    // Check if user has permission to delete category groups (VIEWER role cannot modify)
    if (userMembership.role === 'VIEWER') {
      return NextResponse.json({ 
        error: 'Access denied. Viewers cannot delete category groups.',
        userRole: userMembership.role 
      }, { status: 403 })
    }

    const { id } = params

    // Verify the category group belongs to the user's budget group
    const categoryGroup = await prisma.categoryGroup.findFirst({
      where: { 
        id,
        groupId: userMembership.groupId
      }
    })

    if (!categoryGroup) {
      return NextResponse.json({ error: 'Category group not found or access denied' }, { status: 404 })
    }

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