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
            increment: Math.abs(amount), // Always add positive amount to activity (spending)
          },
          // Recalculate available = budgeted - activity
          available: {
            decrement: Math.abs(amount),
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
          activity: Math.abs(amount), // Always positive for activity
          available: -Math.abs(amount), // Negative available since no budget allocated
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

export async function GET() {
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

    // Get the user's budget group
    const userMembership = await prisma.groupMember.findFirst({
      where: { userId: session.user.id },
      include: { group: true }
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'No budget group found' }, { status: 404 })
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
      cleared = 'UNCLEARED',
      flagColor
    } = body

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
        cleared,
        flagColor: flagColor || null,
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
      // For expense transactions (negative amounts), add to activity
      // For income transactions (positive amounts), we'll handle differently
      if (transactionAmount < 0) {
        // Expense: Add to category activity (spending)
        await updateBudgetActivity(categoryId, transactionAmount, transactionDate, userMembership.groupId)
      } else {
        // Income: For now, we'll still add to category activity but as negative
        // This represents income allocated to this category (like a refund or cashback)
        await updateBudgetActivity(categoryId, -transactionAmount, transactionDate, userMembership.groupId)
      }
    }

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
} 