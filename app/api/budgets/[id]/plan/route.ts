import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, description, currency } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Plan name is required' }, { status: 400 })
    }

    // Check if user has permission to edit this budget group
    const membership = await prisma.groupMember.findFirst({
      where: {
        userId: session.user.id,
        groupId: id,
        role: { in: ['OWNER', 'EDITOR'] }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'You do not have permission to edit this plan' }, { status: 403 })
    }

    // Update budget group
    const budgetGroup = await prisma.budgetGroup.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        currency,
      },
      select: {
        id: true,
        name: true,
        description: true,
        currency: true,
        _count: {
          select: { members: true }
        }
      }
    })

    // Return formatted response
    const plan = {
      id: budgetGroup.id,
      name: budgetGroup.name,
      description: budgetGroup.description,
      currency: budgetGroup.currency,
      role: membership.role,
      memberCount: budgetGroup._count.members
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Failed to update budget plan:', error)
    return NextResponse.json({ error: 'Failed to update budget plan' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if user is owner of this budget group
    const membership = await prisma.groupMember.findFirst({
      where: {
        userId: session.user.id,
        groupId: id,
        role: 'OWNER'
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Only the plan owner can delete this plan' }, { status: 403 })
    }

    // Check if user has other budget groups
    const userMemberships = await prisma.groupMember.findMany({
      where: { userId: session.user.id }
    })

    if (userMemberships.length <= 1) {
      return NextResponse.json({ 
        error: 'Cannot delete your only plan. You must have at least one plan.' 
      }, { status: 400 })
    }

    // Delete budget group (cascade will handle related data)
    await prisma.budgetGroup.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Plan deleted successfully' })
  } catch (error) {
    console.error('Failed to delete budget plan:', error)
    return NextResponse.json({ error: 'Failed to delete budget plan' }, { status: 500 })
  }
} 