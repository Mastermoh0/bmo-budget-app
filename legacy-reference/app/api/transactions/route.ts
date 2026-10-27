import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Helper function to update budget activity based on transaction
async function updateBudgetActivity(categoryId: string, amount: number, transactionDate: Date, groupId: string) {
  try {
    // Get the month for the budget (first day of the month)
    const budgetMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), 1)
    
    // Find or create the budget entry for this category and month
    const existingBudget = await prisma.budget.findUnique({
      where: {
        groupId_categoryId_month: {
          groupId,
          categoryId,
          month: budgetMonth,
        },
      },
    })

    // Determine if this is income or expense
    // Negative amount = expense (money going out)
    // Positive amount = income (money coming in)
    const isIncome = amount > 0
    const absAmount = Math.abs(amount)

    if (existingBudget) {
      // Update existing budget activity
      await prisma.budget.update({
        where: {
          groupId_categoryId_month: {
            groupId,
            categoryId,
            month: budgetMonth,
          },
        },
        data: {
          activity: {
            increment: isIncome ? -absAmount : absAmount, // Income decreases activity, expense increases
          },
          available: {
            increment: isIncome ? absAmount : -absAmount, // Income increases available, expense decreases
          },
        },
      })
    } else {
      // Create new budget entry with this activity
      await prisma.budget.create({
        data: {
          groupId,
          categoryId,
          month: budgetMonth,
          budgeted: 0,
          activity: isIncome ? -absAmount : absAmount, // Income is negative activity, expense is positive
          available: isIncome ? absAmount : -absAmount, // Income increases available, expense decreases
        },
      })
    }
  } catch (error) {
    console.error('Failed to update budget activity:', error)
    // Don't throw - let the transaction creation succeed even if budget update fails
  }
}

// Helper function to update account balances
async function updateAccountBalances(fromAccountId: string, toAccountId: string | null, amount: number) {
  try {
    // Update from account (subtract amount)
    await prisma.budgetAccount.update({
      where: { id: fromAccountId },
      data: {
        balance: {
          decrement: amount,
        },
      },
    })

    // If it's a transfer, update to account (add amount)
    if (toAccountId) {
      await prisma.budgetAccount.update({
        where: { id: toAccountId },
        data: {
          balance: {
            increment: amount,
          },
        },
      })
    }
  } catch (error) {
    console.error('Failed to update account balances:', error)
    // Note: In a production app, you'd want to handle this with a transaction
    // to ensure data consistency
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId')

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
    }

    if (!userMembership) {
      return NextResponse.json([]) // Return empty array if no budget group
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        groupId: userMembership.groupId,
      },
      include: {
        fromAccount: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        toAccount: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            categoryGroup: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
        const {
      date,
      amount,
      payee,
      memo,
      fromAccountId,
      toAccountId,
      categoryId,
      planId // Add planId parameter
    } = body

    let userMembership;

    if (planId) {
      // Verify user has access to the specified plan
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
      // Get the user's first budget group (backward compatibility)
      userMembership = await prisma.groupMember.findFirst({
        where: { userId: session.user.id },
        include: { group: true }
      })
    }

    if (!userMembership) {
      return NextResponse.json({ error: 'No budget group found' }, { status: 404 })
    }

    // Check if user has permission to create transactions (VIEWER role cannot modify)
    if (userMembership.role === 'VIEWER') {
      return NextResponse.json({ 
        error: 'Access denied. Viewers cannot create or modify transactions.',
        userRole: userMembership.role 
      }, { status: 403 })
    }

    // Validate required fields
    if (!date || !amount || !fromAccountId) {
      return NextResponse.json(
        { error: 'Date, amount, and account are required' }, 
        { status: 400 }
      )
    }

    // For transfers, ensure different accounts
    if (toAccountId && fromAccountId === toAccountId) {
      return NextResponse.json(
        { error: 'Cannot transfer to the same account' }, 
        { status: 400 }
      )
    }

    const transactionAmount = parseFloat(amount.toString())
    const transactionDate = new Date(date)

    const transaction = await prisma.transaction.create({
      data: {
        date: transactionDate,
        amount: transactionAmount,
        payee: payee || null,
        memo: memo || null,
        fromAccountId,
        toAccountId: toAccountId || null,
        categoryId: categoryId || null,
        groupId: userMembership.groupId,
      },
      include: {
        fromAccount: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        toAccount: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            categoryGroup: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Update account balances
    await updateAccountBalances(fromAccountId, toAccountId, transactionAmount)

    // Update budget activity if this is a categorized transaction (not a transfer)
    if (categoryId && !toAccountId) {
      // Pass the transaction amount as-is to updateBudgetActivity
      // Negative amount = expense, Positive amount = income
      await updateBudgetActivity(categoryId, transactionAmount, transactionDate, userMembership.groupId)
    }

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
} 