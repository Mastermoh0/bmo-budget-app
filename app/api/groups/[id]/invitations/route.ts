import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = params.id

    // Check if user is a member of this group
    const userMembership = await prisma.userGroup.findFirst({
      where: {
        userId: session.user.id,
        groupId: groupId
      }
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all pending invitations for this group
    const invitations = await prisma.groupInvitation.findMany({
      where: {
        groupId: groupId,
        acceptedAt: null, // Only pending invitations
        expiresAt: {
          gt: new Date() // Not expired
        }
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedInvitations = invitations.map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      createdAt: invitation.createdAt.toISOString(),
      expires: invitation.expiresAt.toISOString(),
      invitedBy: invitation.invitedBy?.name || invitation.invitedBy?.email || 'Unknown'
    }))

    return NextResponse.json({
      invitations: formattedInvitations
    })

  } catch (error) {
    console.error('Error fetching group invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 