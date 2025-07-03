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

    // Parse month or default to current month
    const month = monthParam ? new Date(monthParam) : new Date()
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)

    // Build where clause for transactions
    const whereClause: any = {
      groupId: userMembership.groupId,
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

    // Group spending by category
    const categorySpending = new Map<string, {
      id: string
      name: string
      groupName: string
      groupId: string
      amount: number
      transactionCount: number
    }>()

    // Group spending by category group
    const groupSpending = new Map<string, {
      id: string
      name: string
      amount: number
      transactionCount: number
      categories: string[]
    }>()

    let totalSpending = 0

    transactions.forEach(transaction => {
      const amount = Math.abs(Number(transaction.amount)) // Convert to positive for display
      totalSpending += amount

      // Handle categorized transactions
      if (transaction.category) {
        const categoryId = transaction.category.id
        const categoryName = transaction.category.name
        const groupName = transaction.category.categoryGroup?.name || 'Uncategorized'
        const groupId = transaction.category.categoryGroup?.id || 'uncategorized'

        // Update category spending
        if (categorySpending.has(categoryId)) {
          const existing = categorySpending.get(categoryId)!
          existing.amount += amount
          existing.transactionCount += 1
        } else {
          categorySpending.set(categoryId, {
            id: categoryId,
            name: categoryName,
            groupName,
            groupId,
            amount,
            transactionCount: 1
          })
        }

        // Update group spending
        if (groupSpending.has(groupId)) {
          const existing = groupSpending.get(groupId)!
          existing.amount += amount
          existing.transactionCount += 1
          if (!existing.categories.includes(categoryName)) {
            existing.categories.push(categoryName)
          }
        } else {
          groupSpending.set(groupId, {
            id: groupId,
            name: groupName,
            amount,
            transactionCount: 1,
            categories: [categoryName]
          })
        }
      } else {
        // Handle uncategorized transactions
        const uncategorizedKey = 'uncategorized'
        if (categorySpending.has(uncategorizedKey)) {
          const existing = categorySpending.get(uncategorizedKey)!
          existing.amount += amount
          existing.transactionCount += 1
        } else {
          categorySpending.set(uncategorizedKey, {
            id: uncategorizedKey,
            name: 'Uncategorized',
            groupName: 'Uncategorized',
            groupId: uncategorizedKey,
            amount,
            transactionCount: 1
          })
        }

        // Update uncategorized group
        if (groupSpending.has(uncategorizedKey)) {
          const existing = groupSpending.get(uncategorizedKey)!
          existing.amount += amount
          existing.transactionCount += 1
        } else {
          groupSpending.set(uncategorizedKey, {
            id: uncategorizedKey,
            name: 'Uncategorized',
            amount,
            transactionCount: 1,
            categories: ['Uncategorized']
          })
        }
      }
    })

    // Convert maps to arrays and sort by amount
    const categoriesData = Array.from(categorySpending.values())
      .sort((a, b) => b.amount - a.amount)

    const groupsData = Array.from(groupSpending.values())
      .sort((a, b) => b.amount - a.amount)

    // Fetch available categories and accounts for filters
    const categories = await prisma.category.findMany({
      where: {
        categoryGroup: {
          groupId: userMembership.groupId,
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
        groupId: userMembership.groupId,
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

    return NextResponse.json({
      month: monthStart,
      totalSpending,
      categories: categoriesData,
      groups: groupsData,
      availableCategories: categories,
      availableAccounts: accounts,
      transactionCount: transactions.length,
    })
  } catch (error) {
    console.error('Failed to fetch spending data:', error)
    return NextResponse.json({ error: 'Failed to fetch spending data' }, { status: 500 })
  }
} 