import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Find the invitation
    const invitation = await prisma.groupInvitation.findFirst({
      where: {
        token,
        isAccepted: false,
        expires: {
          gt: new Date() // Not expired
        }
      },
      include: {
        group: true,
        inviter: {
          select: { name: true, email: true }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      )
    }

    // Check if the invitation email matches the current user's email
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true }
    })

    if (!currentUser || currentUser.email !== invitation.email) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 400 }
      )
    }

    // Check if user is already a member of this group
    const existingMembership = await prisma.groupMember.findFirst({
      where: {
        userId: session.user.id,
        groupId: invitation.groupId
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this budget' },
        { status: 400 }
      )
    }

    // Check if the group still has space (5 user limit)
    const memberCount = await prisma.groupMember.count({
      where: { groupId: invitation.groupId }
    })

    if (memberCount >= 5) {
      return NextResponse.json(
        { error: 'This budget has reached the maximum of 5 members' },
        { status: 400 }
      )
    }

    // Accept the invitation
    await prisma.$transaction(async (tx) => {
      // Create group membership
      await tx.groupMember.create({
        data: {
          userId: session.user.id,
          groupId: invitation.groupId,
          role: invitation.role,
        }
      })

      // Mark invitation as accepted
      await tx.groupInvitation.update({
        where: { id: invitation.id },
        data: {
          isAccepted: true,
          acceptedAt: new Date(),
          acceptedBy: session.user.id,
        }
      })
    })

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      group: {
        id: invitation.group.id,
        name: invitation.group.name,
        description: invitation.group.description,
        currency: invitation.group.currency,
      },
      role: invitation.role,
      invitedBy: invitation.inviter.name || invitation.inviter.email
    })

  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation. Please try again.' },
      { status: 500 }
    )
  }
}

// GET route to validate invitation token and show invitation details
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Find the invitation
    const invitation = await prisma.groupInvitation.findFirst({
      where: {
        token,
        isAccepted: false,
        expires: {
          gt: new Date() // Not expired
        }
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            currency: true,
          }
        },
        inviter: {
          select: { name: true, email: true }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        group: invitation.group,
        invitedBy: invitation.inviter.name || invitation.inviter.email,
        createdAt: invitation.createdAt,
        expires: invitation.expires,
      }
    })

  } catch (error) {
    console.error('Get invitation error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve invitation details.' },
      { status: 500 }
    )
  }
} 