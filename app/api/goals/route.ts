import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/goals - Fetch goals for a plan
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId')

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Verify user has access to this budget group (plan)
    const userMembership = await prisma.groupMember.findFirst({
      where: {
        userId: session.user.id,
        groupId: planId,
      },
      include: { group: true }
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'Plan not found or access denied' }, { status: 404 })
    }

    // Fetch goals for this budget group
    const goals = await prisma.goal.findMany({
      where: {
        groupId: planId,
      },
      include: {
        category: {
          include: {
            categoryGroup: true,
          },
        },
        categoryGroup: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(goals)
  } catch (error) {
    console.error('Failed to fetch goals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/goals - Create new goals
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    console.log('Goals API - Received data:', JSON.stringify(data, null, 2))

    const {
      planId,
      type,
      name,
      description,
      targetAmount,
      weeklyAmount,
      monthlyAmount,
      yearlyAmount,
      weeklyDay,
      targetDate,
      categoryIds = [],
      categoryGroupIds = [],
    } = data

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    if (!type) {
      return NextResponse.json({ error: 'Target type is required' }, { status: 400 })
    }

    // Validate goal type
    const validGoalTypes = ['TARGET_BALANCE', 'TARGET_BALANCE_BY_DATE', 'MONTHLY_FUNDING', 'WEEKLY_FUNDING', 'YEARLY_FUNDING', 'PERCENT_OF_INCOME', 'CUSTOM']
    if (!validGoalTypes.includes(type)) {
      console.error('Invalid goal type received:', type)
      return NextResponse.json({ error: `Invalid target type: ${type}. Valid types are: ${validGoalTypes.join(', ')}` }, { status: 400 })
    }

    if (categoryIds.length === 0 && categoryGroupIds.length === 0) {
      return NextResponse.json({ error: 'At least one category or category group must be selected' }, { status: 400 })
    }

    // Verify user has access to this budget group (plan)
    const userMembership = await prisma.groupMember.findFirst({
      where: {
        userId: session.user.id,
        groupId: planId,
      },
      include: { group: true }
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'Plan not found or access denied' }, { status: 404 })
    }

    // Verify categories belong to this budget group
    if (categoryIds.length > 0) {
      const categoryCount = await prisma.category.count({
        where: {
          id: { in: categoryIds },
          categoryGroup: {
            groupId: planId,
          },
        },
      })
      if (categoryCount !== categoryIds.length) {
        return NextResponse.json({ error: 'Some categories do not belong to this plan' }, { status: 400 })
      }
    }

    // Verify category groups belong to this budget group
    if (categoryGroupIds.length > 0) {
      const groupCount = await prisma.categoryGroup.count({
        where: {
          id: { in: categoryGroupIds },
          groupId: planId,
        },
      })
      if (groupCount !== categoryGroupIds.length) {
        return NextResponse.json({ error: 'Some category groups do not belong to this plan' }, { status: 400 })
      }
    }

    // Create goals for each selected item
    const createdGoals = []

    // Create goals for categories
    for (const categoryId of categoryIds) {
      try {
        const goalData: any = {
          type,
          groupId: planId,
          categoryId,
          currentAmount: 0,
        }

        // Add optional fields with proper type conversion
        if (name) goalData.name = name
        if (description) goalData.description = description
        if (targetAmount !== undefined && targetAmount !== null) {
          goalData.targetAmount = parseFloat(targetAmount.toString())
        }
        if (weeklyAmount !== undefined && weeklyAmount !== null) {
          goalData.weeklyAmount = parseFloat(weeklyAmount.toString())
        }
        if (monthlyAmount !== undefined && monthlyAmount !== null) {
          goalData.monthlyAmount = parseFloat(monthlyAmount.toString())
        }
        if (yearlyAmount !== undefined && yearlyAmount !== null) {
          goalData.yearlyAmount = parseFloat(yearlyAmount.toString())
        }
        if (weeklyDay !== undefined) goalData.weeklyDay = parseInt(weeklyDay.toString())
        if (targetDate) goalData.targetDate = new Date(targetDate)

        console.log('Creating goal for category:', categoryId, 'with data:', JSON.stringify(goalData, null, 2))

        const goal = await prisma.goal.create({
          data: goalData,
          include: {
            category: {
              include: {
                categoryGroup: true,
              },
            },
          },
        })

        createdGoals.push(goal)
      } catch (error) {
        console.error('Failed to create goal for category:', categoryId, error)
        throw error
      }
    }

    // Create goals for category groups
    for (const categoryGroupId of categoryGroupIds) {
      try {
        const goalData: any = {
          type,
          groupId: planId,
          categoryGroupId,
          currentAmount: 0,
        }

        // Add optional fields with proper type conversion
        if (name) goalData.name = name
        if (description) goalData.description = description
        if (targetAmount !== undefined && targetAmount !== null) {
          goalData.targetAmount = parseFloat(targetAmount.toString())
        }
        if (weeklyAmount !== undefined && weeklyAmount !== null) {
          goalData.weeklyAmount = parseFloat(weeklyAmount.toString())
        }
        if (monthlyAmount !== undefined && monthlyAmount !== null) {
          goalData.monthlyAmount = parseFloat(monthlyAmount.toString())
        }
        if (yearlyAmount !== undefined && yearlyAmount !== null) {
          goalData.yearlyAmount = parseFloat(yearlyAmount.toString())
        }
        if (weeklyDay !== undefined) goalData.weeklyDay = parseInt(weeklyDay.toString())
        if (targetDate) goalData.targetDate = new Date(targetDate)

        console.log('Creating goal for category group:', categoryGroupId, 'with data:', JSON.stringify(goalData, null, 2))

        const goal = await prisma.goal.create({
          data: goalData,
          include: {
            categoryGroup: true,
          },
        })

        createdGoals.push(goal)
      } catch (error) {
        console.error('Failed to create goal for category group:', categoryGroupId, error)
        throw error
      }
    }

    console.log('Successfully created goals:', createdGoals.length)
    return NextResponse.json({
      message: `Successfully created ${createdGoals.length} target${createdGoals.length === 1 ? '' : 's'}`,
      goals: createdGoals,
    })
  } catch (error) {
    console.error('Failed to create goals - Full error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    // Return more specific error message if available
    let errorMessage = 'Internal server error'
    if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error.message 
    }, { status: 500 })
  }
} 