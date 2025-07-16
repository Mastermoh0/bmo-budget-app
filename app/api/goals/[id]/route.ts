import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/goals/[id] - Get a specific goal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const goalId = params.id

    // Fetch the goal and verify user has access
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        group: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      },
      include: {
        category: {
          include: {
            categoryGroup: true,
          },
        },
        categoryGroup: true,
      },
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 })
    }

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Failed to fetch goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/goals/[id] - Update a specific goal
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const goalId = params.id
    const data = await request.json()

    const {
      type,
      name,
      description,
      targetAmount,
      weeklyAmount,
      monthlyAmount,
      yearlyAmount,
      weeklyDay,
      targetDate,
    } = data

    // Verify the goal exists and user has access
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        group: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      },
    })

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 })
    }

    // Update the goal
    const updatedData: any = {}
    
    if (type) updatedData.type = type
    if (name !== undefined) updatedData.name = name.trim() || null
    if (description !== undefined) updatedData.description = description.trim() || null
    if (targetAmount !== undefined && targetAmount !== null) {
      updatedData.targetAmount = parseFloat(targetAmount.toString())
    }
    if (weeklyAmount !== undefined && weeklyAmount !== null) {
      updatedData.weeklyAmount = parseFloat(weeklyAmount.toString())
    }
    if (monthlyAmount !== undefined && monthlyAmount !== null) {
      updatedData.monthlyAmount = parseFloat(monthlyAmount.toString())
    }
    if (yearlyAmount !== undefined && yearlyAmount !== null) {
      updatedData.yearlyAmount = parseFloat(yearlyAmount.toString())
    }
    if (weeklyDay !== undefined) updatedData.weeklyDay = parseInt(weeklyDay.toString())
    if (targetDate !== undefined) {
      updatedData.targetDate = targetDate ? new Date(targetDate) : null
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: updatedData,
      include: {
        category: {
          include: {
            categoryGroup: true,
          },
        },
        categoryGroup: true,
      },
    })

    return NextResponse.json(updatedGoal)
  } catch (error) {
    console.error('Failed to update goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/goals/[id] - Delete a specific goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const goalId = params.id

    // Verify the goal exists and user has access
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        group: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      },
    })

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 })
    }

    // Delete the goal
    await prisma.goal.delete({
      where: { id: goalId },
    })

    return NextResponse.json({ message: 'Goal deleted successfully' })
  } catch (error) {
    console.error('Failed to delete goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 