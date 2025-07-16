import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = params.id
    const memberIdToRemove = params.memberId

    // Check if current user is an OWNER of this group
    const userMembership = await prisma.groupMember.findFirst({
      where: {
        userId: session.user.id,
        groupId: groupId,
        role: 'OWNER'
      }
    })

    if (!userMembership) {
      return NextResponse.json({ 
        error: 'Access denied. Only group owners can remove members.' 
      }, { status: 403 })
    }

    // Check if the member to remove exists in the group
    const memberToRemove = await prisma.groupMember.findFirst({
      where: {
        userId: memberIdToRemove,
        groupId: groupId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!memberToRemove) {
      return NextResponse.json({ 
        error: 'Member not found in this group' 
      }, { status: 404 })
    }

    // Don't allow users to remove themselves
    if (memberIdToRemove === session.user.id) {
      return NextResponse.json({ 
        error: 'You cannot remove yourself from the group' 
      }, { status: 400 })
    }

    // Check if this is the last owner
    if (memberToRemove.role === 'OWNER') {
      const ownerCount = await prisma.groupMember.count({
        where: {
          groupId: groupId,
          role: 'OWNER'
        }
      })

      if (ownerCount <= 1) {
        return NextResponse.json({ 
          error: 'Cannot remove the last owner of the group' 
        }, { status: 400 })
      }
    }

    // Remove the member from the group
    await prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId: memberIdToRemove,
          groupId: groupId
        }
      }
    })

    return NextResponse.json({ 
      message: `${memberToRemove.user.name || memberToRemove.user.email} has been removed from the group` 
    })

  } catch (error) {
    console.error('Error removing group member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 