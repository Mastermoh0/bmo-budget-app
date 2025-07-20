import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Update category name or budgeted amount
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { categoryId } = params
    const body = await request.json()
    const { name, budgeted, month, isHidden, planId } = body

    let userMembership;

    if (planId) {
      // Get specific group membership if planId is provided
      userMembership = await prisma.groupMember.findFirst({
        where: { 
          userId: session.user.id,
          groupId: planId
        },
        include: { group: true }
      })
      
      if (!userMembership) {
        return NextResponse.json({ error: 'Plan not found or access denied' }, { status: 403 })
      }
    } else {
      // Fall back to first group membership (backward compatibility)
      userMembership = await prisma.groupMember.findFirst({
        where: { userId: session.user.id },
        include: { group: true }
      })

      if (!userMembership) {
        return NextResponse.json({ error: 'No budget group found' }, { status: 404 })
      }
    }

    // Verify category belongs to user's group
    const category = await prisma.category.findFirst({
      where: { 
        id: categoryId,
        categoryGroup: {
          groupId: userMembership.groupId
        }
      },
      include: {
        categoryGroup: true,
        budgets: true,
      }
    })

    if (!category) {
      // Provide more detailed error information
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId },
        include: { categoryGroup: true }
      })
      
      if (!categoryExists) {
        return NextResponse.json({ 
          error: `Category with ID ${categoryId} does not exist in the database`,
          details: { categoryId, planId: userMembership.groupId }
        }, { status: 404 })
      } else {
        return NextResponse.json({ 
          error: `Category ${categoryId} exists but belongs to plan ${categoryExists.categoryGroup.groupId}, not plan ${userMembership.groupId}`,
          details: { 
            categoryId, 
            requestedPlanId: userMembership.groupId,
            actualPlanId: categoryExists.categoryGroup.groupId,
            categoryName: categoryExists.name
          }
        }, { status: 404 })
      }
    }

    // If updating name or hiding/showing category
    if (name !== undefined || isHidden !== undefined) {
      const updateData = {}
      if (name !== undefined) updateData.name = name
      if (isHidden !== undefined) updateData.isHidden = isHidden

      const updatedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: updateData,
        include: {
          budgets: true,
        }
      })

      // Calculate derived fields for the response
      const currentBudget = updatedCategory.budgets.find(b => 
        new Date(b.month).getMonth() === new Date().getMonth() &&
        new Date(b.month).getFullYear() === new Date().getFullYear()
      )

      return NextResponse.json({
        ...updatedCategory,
        budgeted: currentBudget?.budgeted || 0,
        activity: currentBudget?.activity || 0,
        available: (currentBudget?.budgeted || 0) + (currentBudget?.activity || 0)
      })
    }

    // If updating budgeted amount
    if (budgeted !== undefined && month !== undefined) {
      const monthDate = new Date(month)
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      
      // First, try to update existing budget record
      const existingBudget = await prisma.budget.findFirst({
        where: {
          categoryId,
          groupId: userMembership.groupId,
          month: monthStart
        }
      })

      let budget
      if (existingBudget) {
        budget = await prisma.budget.update({
          where: { id: existingBudget.id },
          data: { budgeted }
        })
      } else {
        budget = await prisma.budget.create({
          data: {
            categoryId,
            groupId: userMembership.groupId,
            month: monthStart,
            budgeted,
            activity: 0,
            available: budgeted // For new budget, available = budgeted + activity (0)
          }
        })
      }

      // Get the updated category with budgets
      const updatedCategory = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          budgets: {
            where: {
              groupId: userMembership.groupId
            }
          },
        }
      })

      // Calculate derived fields for the response
      const currentBudget = updatedCategory.budgets.find(b => 
        new Date(b.month).getMonth() === monthDate.getMonth() &&
        new Date(b.month).getFullYear() === monthDate.getFullYear()
      )

      return NextResponse.json({
        ...updatedCategory,
        budgeted: Number(currentBudget?.budgeted || 0),
        activity: Number(currentBudget?.activity || 0),
        available: Number(currentBudget?.budgeted || 0) + Number(currentBudget?.activity || 0)
      })
    }

    return NextResponse.json({ error: 'No valid update data provided' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// Delete category
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { categoryId } = params

    // Get user's group membership to ensure access
    const userMembership = await prisma.groupMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'No budget group found' }, { status: 404 })
    }

    // Check if user has permission to modify categories (VIEWER role cannot modify)
    if (userMembership.role === 'VIEWER') {
      return NextResponse.json({ 
        error: 'Access denied. Viewers cannot modify categories.',
        userRole: userMembership.role 
      }, { status: 403 })
    }

    // Verify category belongs to user's group
    const category = await prisma.category.findFirst({
      where: { 
        id: categoryId,
        categoryGroup: {
          groupId: userMembership.groupId
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

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