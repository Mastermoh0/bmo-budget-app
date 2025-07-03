import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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

    // Verify user owns this plan (assuming planId maps to groupId in our budget system)
    const plan = await prisma.plan.findFirst({
      where: {
        id: planId,
        userId: session.user.id,
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Fetch goals for this plan's budget group
    const goals = await prisma.goal.findMany({
      where: {
        groupId: planId, // Using planId as groupId since they should map 1:1
      },
      include: {
        category: {
          include: {
            group: true,
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

    if (categoryIds.length === 0 && categoryGroupIds.length === 0) {
      return NextResponse.json({ error: 'At least one category or category group must be selected' }, { status: 400 })
    }

    // Verify user owns this plan
    const plan = await prisma.plan.findFirst({
      where: {
        id: planId,
        userId: session.user.id,
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Verify categories belong to this plan (using planId as groupId)
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

    // Verify category groups belong to this plan
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
      const goalData: any = {
        type,
        groupId: planId,
        categoryId,
        currentAmount: 0,
      }

      // Add optional fields
      if (name) goalData.name = name
      if (description) goalData.description = description
      if (targetAmount !== undefined) goalData.targetAmount = targetAmount
      if (weeklyAmount !== undefined) goalData.weeklyAmount = weeklyAmount
      if (monthlyAmount !== undefined) goalData.monthlyAmount = monthlyAmount
      if (yearlyAmount !== undefined) goalData.yearlyAmount = yearlyAmount
      if (weeklyDay !== undefined) goalData.weeklyDay = weeklyDay
      if (targetDate) goalData.targetDate = new Date(targetDate)

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
    }

    // Create goals for category groups
    for (const categoryGroupId of categoryGroupIds) {
      const goalData: any = {
        type,
        groupId: planId,
        categoryGroupId,
        currentAmount: 0,
      }

      // Add optional fields
      if (name) goalData.name = name
      if (description) goalData.description = description
      if (targetAmount !== undefined) goalData.targetAmount = targetAmount
      if (weeklyAmount !== undefined) goalData.weeklyAmount = weeklyAmount
      if (monthlyAmount !== undefined) goalData.monthlyAmount = monthlyAmount
      if (yearlyAmount !== undefined) goalData.yearlyAmount = yearlyAmount
      if (weeklyDay !== undefined) goalData.weeklyDay = weeklyDay
      if (targetDate) goalData.targetDate = new Date(targetDate)

      const goal = await prisma.goal.create({
        data: goalData,
        include: {
          categoryGroup: true,
        },
      })

      createdGoals.push(goal)
    }

    return NextResponse.json({
      message: `Successfully created ${createdGoals.length} target${createdGoals.length === 1 ? '' : 's'}`,
      goals: createdGoals,
    })
  } catch (error) {
    console.error('Failed to create goals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 