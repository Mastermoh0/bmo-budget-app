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
    console.log(`🗑️ Starting account deletion for user: ${userId}`)

    // Delete user and all associated data in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete all authentication related data
      console.log('📝 Cleaning up auth data...')
      await tx.verificationToken.deleteMany({ where: { userId } })
      await tx.passwordResetToken.deleteMany({ where: { userId } })
      await tx.session.deleteMany({ where: { userId } })
      await tx.account.deleteMany({ where: { userId } })

      // 2. Find all budget groups the user owns
      const userBudgetGroups = await tx.budgetGroup.findMany({
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
      
      console.log(`📊 Found ${userBudgetGroups.length} budget groups to delete`)

      // 3. Delete all data from owned budget groups
      for (const group of userBudgetGroups) {
        const groupId = group.id
        console.log(`🗑️ Deleting data for group: ${groupId}`)

        // Delete messages first (no dependencies)
        await tx.message.deleteMany({
          where: { groupId }
        })

        // Delete transaction splits before transactions
        await tx.transactionSplit.deleteMany({
          where: {
            transaction: {
              groupId
            }
          }
        })

        // Delete transactions
        await tx.transaction.deleteMany({
          where: { groupId }
        })

        // Delete money moves
        await tx.moneyMove.deleteMany({
          where: { groupId }
        })

        // Delete goals
        await tx.goal.deleteMany({
          where: { groupId }
        })

        // Delete budgets
        await tx.budget.deleteMany({
          where: { groupId }
        })

        // Delete categories before category groups
        await tx.category.deleteMany({
          where: {
            categoryGroup: {
              groupId
            }
          }
        })

        // Delete category groups
        await tx.categoryGroup.deleteMany({
          where: { groupId }
        })

        // Delete budget accounts
        await tx.budgetAccount.deleteMany({
          where: { groupId }
        })

        // Delete group invitations
        await tx.groupInvitation.deleteMany({
          where: { groupId }
        })

        // Delete group members
        await tx.groupMember.deleteMany({
          where: { groupId }
        })

        // Finally delete the group itself
        await tx.budgetGroup.delete({
          where: { id: groupId }
        })
      }

      // 4. Delete invitations sent by or accepted by this user
      await tx.groupInvitation.deleteMany({
        where: {
          OR: [
            { invitedBy: userId },
            { acceptedBy: userId }
          ]
        }
      })

      // 5. Remove user from any groups they're a member of (but don't own)
      await tx.groupMember.deleteMany({
        where: { userId }
      })

      // 6. Delete user's messages
      await tx.message.deleteMany({
        where: { senderId: userId }
      })

      // 7. Finally, delete the user account itself
      await tx.user.delete({
        where: { id: userId }
      })

      console.log('✅ Account deletion completed successfully')
    })

    return NextResponse.json({ 
      success: true,
      message: 'Account deleted successfully' 
    })

  } catch (error) {
    console.error('❌ Failed to delete account:', error)
    console.error('Stack trace:', error.stack)
    
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete account. Please try again or contact support.',
      details: error.message
    }, { status: 500 })
  }
} 