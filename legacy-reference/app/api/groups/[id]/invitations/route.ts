import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = resolvedParams.id

    // Check if user is a member of this group
    const userMembership = await prisma.groupMember.findFirst({
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
        expires: {
          gt: new Date() // Not expired
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const inviters = await prisma.user.findMany({
      where: { id: { in: Array.from(new Set(invitations.map(invitation => invitation.invitedBy))) } },
      select: { id: true, name: true, email: true }
    })
    const inviterById = new Map(inviters.map(inviter => [inviter.id, inviter]))

    const formattedInvitations = invitations.map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      createdAt: invitation.createdAt.toISOString(),
      expires: invitation.expires.toISOString(),
      invitedBy: inviterById.get(invitation.invitedBy)?.name || inviterById.get(invitation.invitedBy)?.email || 'Unknown'
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
