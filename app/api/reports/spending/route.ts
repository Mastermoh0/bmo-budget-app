import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's budget group
    const userMembership = await prisma.groupMember.findFirst({
      where: { userId: session.user.id },
      include: { group: true }
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'No budget group found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month')
    const categoryFilter = searchParams.get('category')
    const accountFilter = searchParams.get('account')
    const planId = searchParams.get('planId')

    // Parse month or default to current month
    const month = monthParam ? new Date(monthParam) : new Date()
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)

    // Use specified planId or default to user's group
    const targetGroupId = planId || userMembership.groupId

    // Build where clause for transactions
    const whereClause: any = {
      groupId: targetGroupId,
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
      amount: {
        lt: 0, // Only expenses (negative amounts)
      },
    }

    // Add category filter if specified
    if (categoryFilter && categoryFilter !== 'all') {
      whereClause.categoryId = categoryFilter
    }

    // Add account filter if specified
    if (accountFilter && accountFilter !== 'all') {
      whereClause.fromAccountId = accountFilter
    }

    // Fetch spending transactions with category and account details
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: {
          include: {
            categoryGroup: true,
          },
        },
        fromAccount: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Fetch budget data for the same month
    const categoryGroups = await prisma.categoryGroup.findMany({
      where: {
        groupId: targetGroupId,
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

    // Create maps for budget data
    const budgetDataMap = new Map<string, {
      budgeted: number
      activity: number
      available: number
    }>()

    // Process budget data
    let totalBudgeted = 0
    let totalBudgetActivity = 0
    let totalAvailable = 0

    categoryGroups.forEach(group => {
      group.categories.forEach(category => {
        const budget = category.budgets[0] || { budgeted: 0, activity: 0, available: 0 }
        const budgeted = Number(budget.budgeted)
        const activity = Number(budget.activity)
        const available = Number(budget.available)
        
        totalBudgeted += budgeted
        totalBudgetActivity += activity
        totalAvailable += available
        
        budgetDataMap.set(category.id, {
          budgeted,
          activity,
          available
        })
      })
    })

    // Group spending by category with budget comparisons
    const categorySpending = new Map<string, {
      id: string
      name: string
      groupName: string
      groupId: string
      actualSpending: number
      budgeted: number
      available: number
      budgetActivity: number
      variance: number
      budgetUtilization: number
      transactionCount: number
    }>()

    // Group spending by category group with budget comparisons
    const groupSpending = new Map<string, {
      id: string
      name: string
      actualSpending: number
      budgeted: number
      available: number
      budgetActivity: number
      variance: number
      budgetUtilization: number
      transactionCount: number
      categories: string[]
    }>()

    let totalActualSpending = 0

    // Process transactions
    transactions.forEach(transaction => {
      const amount = Math.abs(Number(transaction.amount)) // Convert to positive for display
      totalActualSpending += amount

      // Handle categorized transactions
      if (transaction.category) {
        const categoryId = transaction.category.id
        const categoryName = transaction.category.name
        const groupName = transaction.category.categoryGroup?.name || 'Uncategorized'
        const groupId = transaction.category.categoryGroup?.id || 'uncategorized'

        // Get budget data for this category
        const budgetData = budgetDataMap.get(categoryId) || { budgeted: 0, activity: 0, available: 0 }

        // Update category spending
        if (categorySpending.has(categoryId)) {
          const existing = categorySpending.get(categoryId)!
          existing.actualSpending += amount
          existing.transactionCount += 1
          // Recalculate variance and utilization
          existing.variance = existing.actualSpending - existing.budgeted
          existing.budgetUtilization = existing.budgeted > 0 ? (existing.actualSpending / existing.budgeted) * 100 : 0
        } else {
          const variance = amount - budgetData.budgeted
          const budgetUtilization = budgetData.budgeted > 0 ? (amount / budgetData.budgeted) * 100 : 0
          
          categorySpending.set(categoryId, {
            id: categoryId,
            name: categoryName,
            groupName,
            groupId,
            actualSpending: amount,
            budgeted: budgetData.budgeted,
            available: budgetData.available,
            budgetActivity: budgetData.activity,
            variance,
            budgetUtilization,
            transactionCount: 1
          })
        }

        // Update group spending
        if (groupSpending.has(groupId)) {
          const existing = groupSpending.get(groupId)!
          existing.actualSpending += amount
          existing.transactionCount += 1
          if (!existing.categories.includes(categoryName)) {
            existing.categories.push(categoryName)
          }
          // Recalculate variance and utilization
          existing.variance = existing.actualSpending - existing.budgeted
          existing.budgetUtilization = existing.budgeted > 0 ? (existing.actualSpending / existing.budgeted) * 100 : 0
        } else {
          // Get total budgeted for this group
          const groupBudgeted = Array.from(budgetDataMap.entries())
            .filter(([catId]) => {
              // Find category by ID and check if it belongs to this group
              const cat = categoryGroups.find(g => g.id === groupId)?.categories.find(c => c.id === catId)
              return cat !== undefined
            })
            .reduce((sum, [, budget]) => sum + budget.budgeted, 0)
          
          const variance = amount - groupBudgeted
          const budgetUtilization = groupBudgeted > 0 ? (amount / groupBudgeted) * 100 : 0
          
          groupSpending.set(groupId, {
            id: groupId,
            name: groupName,
            actualSpending: amount,
            budgeted: groupBudgeted,
            available: 0, // Will calculate this properly
            budgetActivity: 0, // Will calculate this properly
            variance,
            budgetUtilization,
            transactionCount: 1,
            categories: [categoryName]
          })
        }
      } else {
        // Handle uncategorized transactions
        const uncategorizedKey = 'uncategorized'
        if (categorySpending.has(uncategorizedKey)) {
          const existing = categorySpending.get(uncategorizedKey)!
          existing.actualSpending += amount
          existing.transactionCount += 1
          existing.variance = existing.actualSpending - existing.budgeted
        } else {
          categorySpending.set(uncategorizedKey, {
            id: uncategorizedKey,
            name: 'Uncategorized',
            groupName: 'Uncategorized',
            groupId: uncategorizedKey,
            actualSpending: amount,
            budgeted: 0,
            available: 0,
            budgetActivity: 0,
            variance: amount, // All uncategorized spending is over budget
            budgetUtilization: 0,
            transactionCount: 1
          })
        }

        // Update uncategorized group
        if (groupSpending.has(uncategorizedKey)) {
          const existing = groupSpending.get(uncategorizedKey)!
          existing.actualSpending += amount
          existing.transactionCount += 1
        } else {
          groupSpending.set(uncategorizedKey, {
            id: uncategorizedKey,
            name: 'Uncategorized',
            actualSpending: amount,
            budgeted: 0,
            available: 0,
            budgetActivity: 0,
            variance: amount,
            budgetUtilization: 0,
            transactionCount: 1,
            categories: ['Uncategorized']
          })
        }
      }
    })

    // Add categories with budgets but no transactions
    categoryGroups.forEach(group => {
      group.categories.forEach(category => {
        if (!categorySpending.has(category.id)) {
          const budgetData = budgetDataMap.get(category.id) || { budgeted: 0, activity: 0, available: 0 }
          
          categorySpending.set(category.id, {
            id: category.id,
            name: category.name,
            groupName: group.name,
            groupId: group.id,
            actualSpending: 0,
            budgeted: budgetData.budgeted,
            available: budgetData.available,
            budgetActivity: budgetData.activity,
            variance: -budgetData.budgeted, // Under budget
            budgetUtilization: 0,
            transactionCount: 0
          })
        }
      })
    })

    // Calculate group totals for groups with budgets but no transactions
    categoryGroups.forEach(group => {
      if (!groupSpending.has(group.id)) {
        const groupBudgeted = group.categories.reduce((sum, cat) => {
          const budgetData = budgetDataMap.get(cat.id) || { budgeted: 0, activity: 0, available: 0 }
          return sum + budgetData.budgeted
        }, 0)
        
        const groupAvailable = group.categories.reduce((sum, cat) => {
          const budgetData = budgetDataMap.get(cat.id) || { budgeted: 0, activity: 0, available: 0 }
          return sum + budgetData.available
        }, 0)
        
        const groupActivity = group.categories.reduce((sum, cat) => {
          const budgetData = budgetDataMap.get(cat.id) || { budgeted: 0, activity: 0, available: 0 }
          return sum + budgetData.activity
        }, 0)

        if (groupBudgeted > 0) {
          groupSpending.set(group.id, {
            id: group.id,
            name: group.name,
            actualSpending: 0,
            budgeted: groupBudgeted,
            available: groupAvailable,
            budgetActivity: groupActivity,
            variance: -groupBudgeted, // Under budget
            budgetUtilization: 0,
            transactionCount: 0,
            categories: group.categories.map(cat => cat.name)
          })
        }
      }
    })

    // Convert maps to arrays and sort by actual spending
    const categoriesData = Array.from(categorySpending.values())
      .sort((a, b) => b.actualSpending - a.actualSpending)

    const groupsData = Array.from(groupSpending.values())
      .sort((a, b) => b.actualSpending - a.actualSpending)

    // Fetch available categories and accounts for filters
    const categories = await prisma.category.findMany({
      where: {
        categoryGroup: {
          groupId: targetGroupId,
          isHidden: false,
        },
        isHidden: false,
      },
      include: {
        categoryGroup: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    const accounts = await prisma.budgetAccount.findMany({
      where: {
        groupId: targetGroupId,
        isClosed: false,
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Calculate budget performance metrics
    const totalVariance = totalActualSpending - totalBudgeted
    const overallBudgetUtilization = totalBudgeted > 0 ? (totalActualSpending / totalBudgeted) * 100 : 0
    const categoriesOverBudget = categoriesData.filter(cat => cat.variance > 0).length
    const categoriesUnderBudget = categoriesData.filter(cat => cat.variance < 0).length

    return NextResponse.json({
      month: monthStart,
      // Transaction data
      totalSpending: totalActualSpending,
      transactionCount: transactions.length,
      // Budget data
      totalBudgeted,
      totalBudgetActivity,
      totalAvailable,
      // Performance metrics
      totalVariance,
      overallBudgetUtilization,
      categoriesOverBudget,
      categoriesUnderBudget,
      // Detailed data
      categories: categoriesData,
      groups: groupsData,
      // Filter options
      availableCategories: categories,
      availableAccounts: accounts,
    })
  } catch (error) {
    console.error('Failed to fetch spending data:', error)
    return NextResponse.json({ error: 'Failed to fetch spending data' }, { status: 500 })
  }
} 