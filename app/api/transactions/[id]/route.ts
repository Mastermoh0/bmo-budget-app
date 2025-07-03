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
    // Don't throw - let the transaction operation succeed even if budget update fails
  }
}

// Helper function to reverse budget activity when transaction is deleted/changed
async function reverseBudgetActivity(categoryId: string, amount: number, transactionDate: Date, groupId: string) {
  try {
    // Get the month for the budget (first day of the month)
    const budgetMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), 1)
    
    // Update existing budget activity by removing the transaction's impact
    await prisma.budget.updateMany({
      where: {
        groupId,
        categoryId,
        month: budgetMonth,
      },
      data: {
        activity: {
          decrement: Math.abs(amount), // Remove the activity
        },
        available: {
          increment: Math.abs(amount), // Add back to available
        },
      },
    })
  } catch (error) {
    console.error('Failed to reverse budget activity:', error)
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
  }
}

// Helper function to reverse account balance changes
async function reverseAccountBalances(fromAccountId: string, toAccountId: string | null, amount: number) {
  try {
    // Reverse from account (add amount back)
    await prisma.budgetAccount.update({
      where: { id: fromAccountId },
      data: {
        balance: {
          increment: amount,
        },
      },
    })

    // If it was a transfer, reverse to account (subtract amount)
    if (toAccountId) {
      await prisma.budgetAccount.update({
        where: { id: toAccountId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      })
    }
  } catch (error) {
    console.error('Failed to reverse account balances:', error)
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
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

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Failed to fetch transaction:', error)
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    // Get the original transaction to reverse its effects
    const originalTransaction = await prisma.transaction.findUnique({
      where: { id: params.id },
    })

    if (!originalTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Reverse the original transaction's effects
    await reverseAccountBalances(
      originalTransaction.fromAccountId, 
      originalTransaction.toAccountId, 
      Number(originalTransaction.amount)
    )

    if (originalTransaction.categoryId && !originalTransaction.toAccountId) {
      await reverseBudgetActivity(
        originalTransaction.categoryId,
        originalTransaction.amount < 0 ? originalTransaction.amount : -Number(originalTransaction.amount),
        originalTransaction.date,
        userMembership.groupId
      )
    }

    const transactionAmount = parseFloat(amount.toString())
    const transactionDate = new Date(date)

    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: params.id },
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

    // Apply the new transaction's effects
    await updateAccountBalances(fromAccountId, toAccountId, transactionAmount)

    if (categoryId && !toAccountId) {
      if (transactionAmount < 0) {
        // Expense: Add to category activity (spending)
        await updateBudgetActivity(categoryId, transactionAmount, transactionDate, userMembership.groupId)
      } else {
        // Income: Add to category activity but as negative
        await updateBudgetActivity(categoryId, -transactionAmount, transactionDate, userMembership.groupId)
      }
    }

    return NextResponse.json(updatedTransaction)
  } catch (error) {
    console.error('Failed to update transaction:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    // Get the transaction to reverse its effects
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Reverse the transaction's effects
    await reverseAccountBalances(
      transaction.fromAccountId, 
      transaction.toAccountId, 
      Number(transaction.amount)
    )

    if (transaction.categoryId && !transaction.toAccountId) {
      await reverseBudgetActivity(
        transaction.categoryId,
        transaction.amount < 0 ? transaction.amount : -Number(transaction.amount),
        transaction.date,
        userMembership.groupId
      )
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Failed to delete transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
} 