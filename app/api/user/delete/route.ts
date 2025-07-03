import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// DELETE /api/user/delete - Delete user account and all associated data
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Delete user and all associated data (cascading deletes should handle most of this)
    // But we'll be explicit about the order to ensure clean deletion
    
    // 1. Delete password reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId }
    })

    // 2. Delete user sessions
    await prisma.session.deleteMany({
      where: { userId }
    })

    // 3. Delete accounts (OAuth accounts)
    await prisma.budgetAccount.deleteMany({
      where: { userId }
    })

    // 4. Find all budget groups the user owns
    const userBudgetGroups = await prisma.budgetGroup.findMany({
      where: {
        members: {
          some: {
            userId,
            role: 'OWNER'
          }
        }
      },
      select: { id: true }
    })

    // 5. Delete all data from owned budget groups
    for (const group of userBudgetGroups) {
      const groupId = group.id

      // Delete goals
      await prisma.goal.deleteMany({
        where: { groupId }
      })

      // Delete budgets
      await prisma.budget.deleteMany({
        where: { groupId }
      })

      // Delete transaction splits
      await prisma.transactionSplit.deleteMany({
        where: {
          transaction: {
            groupId
          }
        }
      })

      // Delete transactions
      await prisma.transaction.deleteMany({
        where: { groupId }
      })

      // Delete money moves
      await prisma.moneyMove.deleteMany({
        where: { groupId }
      })

      // Delete categories (this will cascade to related data)
      await prisma.category.deleteMany({
        where: {
          categoryGroup: {
            groupId
          }
        }
      })

      // Delete category groups
      await prisma.categoryGroup.deleteMany({
        where: { groupId }
      })

      // Delete budget accounts
      await prisma.budgetAccount.deleteMany({
        where: { groupId }
      })

      // Delete group members
      await prisma.groupMember.deleteMany({
        where: { groupId }
      })
    }

    // 6. Remove user from any budget groups they're a member of (but don't own)
    await prisma.groupMember.deleteMany({
      where: { userId }
    })

    // 7. Delete the budget groups the user owns
    await prisma.budgetGroup.deleteMany({
      where: {
        id: {
          in: userBudgetGroups.map(g => g.id)
        }
      }
    })

    // 8. Finally, delete the user account
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ 
      message: 'Account deleted successfully' 
    })

  } catch (error) {
    console.error('Failed to delete account:', error)
    return NextResponse.json({ 
      error: 'Failed to delete account. Please try again or contact support.' 
    }, { status: 500 })
  }
} 