import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Check if user has significant message activity that should trigger warnings
async function checkUserMessageActivity(userId: string) {
  const messageCount = await prisma.message.count({
    where: { senderId: userId }
  })
  
  const recentMessages = await prisma.message.count({
    where: {
      senderId: userId,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    }
  })

  return {
    totalMessages: messageCount,
    recentMessages,
    shouldWarn: messageCount > 10 || recentMessages > 3
  }
}

// Anonymize user messages instead of deleting them
async function anonymizeUserMessages(userId: string, tx: any) {
  // Get user info for anonymization
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true }
  })

  if (!user) return

  // Calculate deletion time (24 hours from now)
  const scheduledDelete = new Date(Date.now() + 24 * 60 * 60 * 1000)

  // Anonymize messages instead of deleting
  const updateResult = await tx.message.updateMany({
    where: { senderId: userId },
    data: {
      senderId: null,
      senderName: user.name || '[Removed User]',
      senderEmail: '[deleted]',
      isAnonymized: true,
      anonymizedAt: new Date(),
      scheduledDelete: scheduledDelete
    }
  })

  console.log(`📝 Anonymized ${updateResult.count} messages for user ${userId}`)
  return updateResult.count
}

// GET /api/user/delete - Check deletion warnings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const messageActivity = await checkUserMessageActivity(userId)

    // Get user's owned groups with members
    const userBudgetGroups = await prisma.budgetGroup.findMany({
      where: {
        members: {
          some: {
            userId,
            role: 'OWNER'
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            messages: true,
            transactions: true,
            budgetAccounts: true
          }
        }
      }
    })

    const groupsWithOtherMembers = userBudgetGroups.filter(group => 
      group.members.length > 1
    )

    return NextResponse.json({
      messageActivity,
      ownedGroups: userBudgetGroups.length,
      groupsWithOtherMembers: groupsWithOtherMembers.length,
      groupDetails: groupsWithOtherMembers.map(group => {
        const otherMembers = group.members.filter(m => m.userId !== userId)
        // Determine who will become the new owner
        const nextOwner = otherMembers.find(m => m.role === 'EDITOR') || 
                         otherMembers.sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())[0]
        
        return {
          id: group.id,
          name: group.name,
          memberCount: group.members.length,
          messageCount: group._count.messages,
          transactionCount: group._count.transactions,
          accountCount: group._count.budgetAccounts,
          newOwner: nextOwner ? {
            name: nextOwner.user.name,
            email: nextOwner.user.email,
            role: nextOwner.role,
            reason: nextOwner.role === 'EDITOR' ? 'Oldest Editor' : 'Oldest Member'
          } : null,
          members: otherMembers.map(m => ({
            name: m.user.name,
            email: m.user.email,
            role: m.role
          }))
        }
      }),
      warnings: {
        hasMessages: messageActivity.shouldWarn,
        hasOwnedGroupsWithMembers: groupsWithOtherMembers.length > 0,
        messageCount: messageActivity.totalMessages,
        recentMessageCount: messageActivity.recentMessages,
        ownershipTransferInfo: groupsWithOtherMembers.length > 0 ? 
          `Your ${groupsWithOtherMembers.length} budget plan(s) will be automatically transferred to other members.` : 
          null
      }
    })

  } catch (error) {
    console.error('❌ Failed to check deletion requirements:', error)
    return NextResponse.json({ 
      error: 'Failed to check deletion requirements',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE /api/user/delete - Delete user account with improved message handling
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Safely parse JSON body - handle cases where body might be empty
    let body = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch (error) {
      console.log('No JSON body provided, using defaults')
    }
    
    const { confirmDeletion = false } = body

    const userId = session.user.id
    console.log(`🗑️ Starting account deletion for user: ${userId}`)

    // Check for warnings if not confirmed
    if (!confirmDeletion) {
      // Return warnings instead of proceeding with deletion
      const messageActivity = await checkUserMessageActivity(userId)
      
      const userBudgetGroups = await prisma.budgetGroup.findMany({
        where: {
          members: {
            some: {
              userId,
              role: 'OWNER'
            }
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          },
          _count: {
            select: {
              messages: true,
              transactions: true,
              budgetAccounts: true
            }
          }
        }
      })

      const groupsWithOtherMembers = userBudgetGroups.filter(group => 
        group.members.length > 1
      )

      return NextResponse.json({
        requiresConfirmation: true,
        messageActivity,
        ownedGroups: userBudgetGroups.length,
        groupsWithOtherMembers: groupsWithOtherMembers.length,
        groupDetails: groupsWithOtherMembers.map(group => {
          const otherMembers = group.members.filter(m => m.userId !== userId)
          // Determine who will become the new owner
          const nextOwner = otherMembers.find(m => m.role === 'EDITOR') || 
                           otherMembers.sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())[0]
          
          return {
            id: group.id,
            name: group.name,
            memberCount: group.members.length,
            messageCount: group._count.messages,
            transactionCount: group._count.transactions,
            accountCount: group._count.budgetAccounts,
            newOwner: nextOwner ? {
              name: nextOwner.user.name,
              email: nextOwner.user.email,
              role: nextOwner.role,
              reason: nextOwner.role === 'EDITOR' ? 'Oldest Editor' : 'Oldest Member'
            } : null,
            members: otherMembers.map(m => ({
              name: m.user.name,
              email: m.user.email,
              role: m.role
            }))
          }
        }),
        warnings: {
          hasMessages: messageActivity.shouldWarn,
          hasOwnedGroupsWithMembers: groupsWithOtherMembers.length > 0,
          messageCount: messageActivity.totalMessages,
          recentMessageCount: messageActivity.recentMessages,
          ownershipTransferInfo: groupsWithOtherMembers.length > 0 ? 
            `Your ${groupsWithOtherMembers.length} budget plan(s) will be automatically transferred to other members.` : 
            null
        }
      })
    }

    // Delete user and all associated data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete all authentication related data
      console.log('📝 Cleaning up auth data...')
      await tx.verificationToken.deleteMany({ where: { userId } })
      await tx.passwordResetToken.deleteMany({ where: { userId } })
      await tx.session.deleteMany({ where: { userId } })
      await tx.account.deleteMany({ where: { userId } })

      // 2. Anonymize user messages instead of deleting them
      console.log('📝 Anonymizing user messages...')
      const anonymizedCount = await anonymizeUserMessages(userId, tx)

      // 3. Find all budget groups the user owns
      const userBudgetGroups = await tx.budgetGroup.findMany({
        where: {
          members: {
            some: {
              userId,
              role: 'OWNER'
            }
          }
        },
        select: { id: true, name: true }
      })
      
      console.log(`📊 Found ${userBudgetGroups.length} budget groups to delete`)

      // 4. Handle ownership transfer for groups with other members
      for (const group of userBudgetGroups) {
        const groupId = group.id
        
        // Get all other members of this group (excluding the user being deleted)
        const otherMembers = await tx.groupMember.findMany({
          where: {
            groupId: groupId,
            userId: { not: userId }
          },
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { joinedAt: 'asc' } // Oldest first
        })

        if (otherMembers.length > 0) {
          // Find the next owner by priority: Editors first, then Viewers
          const nextOwner = otherMembers.find(m => m.role === 'EDITOR') || otherMembers[0]
          
          console.log(`👑 Auto-transferring ownership of "${group.name}" from deleted user to ${nextOwner.user.name} (${nextOwner.user.email})`)
          console.log(`📊 Transfer reason: ${nextOwner.role === 'EDITOR' ? 'Oldest Editor' : 'Oldest Member'} (joined: ${nextOwner.joinedAt})`)
          
          // Transfer ownership to the selected member
          await tx.groupMember.update({
            where: {
              userId_groupId: {
                userId: nextOwner.userId,
                groupId: groupId
              }
            },
            data: { role: 'OWNER' }
          })

          // Log the ownership transfer for audit purposes
          console.log(`✅ Successfully transferred ownership of group ${groupId} to user ${nextOwner.userId}`)
          
        } else {
          // No other members - safe to delete the group completely
          console.log(`🗑️ No other members in group "${group.name}" - deleting group data`)

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

          // Delete notes
          await tx.note.deleteMany({
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

          // Messages will be handled by the anonymization above

          // Finally delete the group itself
          await tx.budgetGroup.delete({
            where: { id: groupId }
          })
        }
      }

      // 5. Delete invitations sent by or accepted by this user
      await tx.groupInvitation.deleteMany({
        where: {
          OR: [
            { invitedBy: userId },
            { acceptedBy: userId }
          ]
        }
      })

      // 6. Remove user from any groups they're a member of (but don't own)
      await tx.groupMember.deleteMany({
        where: { userId }
      })

      // 7. Finally, delete the user account itself
      await tx.user.delete({
        where: { id: userId }
      })

      console.log('✅ Account deletion completed successfully')
      
      return {
        groupsDeleted: userBudgetGroups.filter(g => !transferOwnership.find(t => t.groupId === g.id)).length,
        groupsTransferred: transferOwnership.length,
        messagesAnonymized: anonymizedCount
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Account deleted successfully',
      details: result
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