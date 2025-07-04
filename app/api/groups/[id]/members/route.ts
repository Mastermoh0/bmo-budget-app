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
    const userMembership = await prisma.groupMember.findFirst({
      where: {
        userId: session.user.id,
        groupId: groupId
      }
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all members of the group
    const members = await prisma.groupMember.findMany({
      where: {
        groupId: groupId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then EDITOR, then VIEWER
        { joinedAt: 'asc' }
      ]
    })

    const formattedMembers = members.map(member => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
      joinedAt: member.joinedAt.toISOString()
    }))

    return NextResponse.json({
      members: formattedMembers,
      currentUserRole: userMembership.role
    })

  } catch (error) {
    console.error('Error fetching group members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 