import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getCurrentMonth } from '@/lib/utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const monthParam = searchParams.get('month')
  const planId = searchParams.get('planId')
  
  // Parse month or default to current month
  const month = monthParam ? new Date(monthParam) : getCurrentMonth()
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)

  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userMembership;

    if (planId) {
      // Get specific budget group membership if planId is provided
      userMembership = await prisma.groupMember.findFirst({
        where: { 
          userId: session.user.id,
          groupId: planId
        },
        include: { group: true }
      })
      
      if (!userMembership) {
        return NextResponse.json({ error: 'Plan not found or access denied' }, { status: 404 })
      }
    } else {
      // Get the user's first budget group (backward compatibility)
      userMembership = await prisma.groupMember.findFirst({
        where: { userId: session.user.id },
        include: { group: true }
      })

      if (!userMembership) {
        // Return empty budget data if user doesn't have a budget group yet
        return NextResponse.json({
          month: monthStart,
          toBeBudgeted: 0,
          totalBudgeted: 0,
          totalActivity: 0,
          totalAvailable: 0,
          totalIncome: 0,
          categoryGroups: [],
        })
      }
    }

    // Get all category groups with categories and their budgets for the specified month
    const categoryGroups = await prisma.categoryGroup.findMany({
      where: {
        groupId: userMembership.groupId,
        isHidden: false,
      },
      include: {
        categories: {
          where: { isHidden: false },
          include: {
            budgets: {
              where: { month: monthStart },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    // Calculate total account balances (what user actually has available to budget)
    const accounts = await prisma.budgetAccount.findMany({
      where: {
        groupId: userMembership.groupId,
        isClosed: false, // Only include open accounts
      },
      select: {
        balance: true,
      },
    })

    const totalIncome = accounts.reduce((sum, account) => {
      return sum + Number(account.balance)
    }, 0)

    // Calculate totals and "To Be Budgeted"
    let totalBudgeted = 0
    let totalActivity = 0
    let totalAvailable = 0

    // Transform the data to include budget info
    const transformedGroups = categoryGroups.map(group => ({
      ...group,
      categories: group.categories.map(category => {
        const budget = category.budgets[0] || { budgeted: 0, activity: 0, available: 0 }
        const budgeted = Number(budget.budgeted)
        const activity = Number(budget.activity)
        const available = Number(budget.available)
        
        totalBudgeted += budgeted
        totalActivity += activity
        totalAvailable += available
        
        return {
          ...category,
          budgeted,
          activity,
          available,
        }
      }),
    }))

    // To Be Budgeted = Income - Total Budgeted
    const toBeBudgeted = totalIncome - totalBudgeted

    return NextResponse.json({
      month: monthStart,
      toBeBudgeted,
      totalBudgeted,
      totalActivity,
      totalAvailable,
      totalIncome,
      categoryGroups: transformedGroups,
    })
  } catch (error) {
    console.error('Failed to fetch budget data:', error)
    return NextResponse.json({ error: 'Failed to fetch budget data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, currency = 'USD' } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Plan name is required' }, { status: 400 })
    }

    // Create new budget group (plan)
    const budgetGroup = await prisma.budgetGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        currency,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER'
          }
        }
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
      role: 'OWNER',
      memberCount: budgetGroup._count.members
    }

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Failed to create budget plan:', error)
    return NextResponse.json({ error: 'Failed to create budget plan' }, { status: 500 })
  }
} 