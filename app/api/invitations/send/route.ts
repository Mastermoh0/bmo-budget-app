import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendInvitationEmail, generateInvitationToken } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, role, groupId } = body

    // Validate required fields
    if (!email || !role || !groupId) {
      return NextResponse.json(
        { error: 'Email, role, and group ID are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['VIEWER', 'EDITOR', 'OWNER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be VIEWER, EDITOR, or OWNER' },
        { status: 400 }
      )
    }

    // Check if the current user has permission to invite (must be OWNER or ADMIN)
    const currentUserMembership = await prisma.groupMember.findFirst({
      where: {
        userId: session.user.id,
        groupId: groupId,
        role: { in: ['OWNER'] } // Only owners can invite users
      },
      include: {
        group: true
      }
    })

    if (!currentUserMembership) {
      return NextResponse.json(
        { error: 'You do not have permission to invite users to this budget' },
        { status: 403 }
      )
    }

    // Check if the group already has 5 members
    const memberCount = await prisma.groupMember.count({
      where: { groupId: groupId }
    })

    if (memberCount >= 5) {
      return NextResponse.json(
        { error: 'This budget has reached the maximum of 5 members' },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const existingMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        user: {
          email: email.toLowerCase()
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'This user is already a member of this budget' },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation and invalidate it
    const existingInvitation = await prisma.groupInvitation.findFirst({
      where: {
        email: email.toLowerCase(),
        groupId: groupId,
        isAccepted: false,
        expires: {
          gt: new Date() // Not expired
        }
      }
    })

    // If there's an existing invitation, mark it as expired to allow a new one
    if (existingInvitation) {
      await prisma.groupInvitation.update({
        where: { id: existingInvitation.id },
        data: { expires: new Date() } // Set expiry to now to invalidate it
      })
    }

    // Generate invitation token and set expiration (7 days)
    const token = generateInvitationToken()
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create the invitation
    const invitation = await prisma.groupInvitation.create({
      data: {
        email: email.toLowerCase(),
        token,
        role,
        expires,
        invitedBy: session.user.id,
        groupId: groupId,
      }
    })

    // Get the current user's name for the email
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    })

    // Send invitation email
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
    const emailResult = await sendInvitationEmail(
      email,
      currentUser?.name || 'Someone',
      currentUserMembership.group.name,
      role,
      token,
      baseUrl
    )

    if (!emailResult.success) {
      // If email fails, clean up the invitation
      await prisma.groupInvitation.delete({
        where: { id: invitation.id }
      })

      return NextResponse.json(
        { error: 'Failed to send invitation email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: existingInvitation ? 'Invitation resent successfully' : 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires: invitation.expires,
        createdAt: invitation.createdAt
      },
      isResend: !!existingInvitation
    })

  } catch (error) {
    console.error('Send invitation error:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation. Please try again.' },
      { status: 500 }
    )
  }
} 