import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = params.id
    const body = await request.json()
    const { name } = body

    // Check if user is an OWNER of this group
    const userMembership = await prisma.groupMember.findFirst({
      where: {
        userId: session.user.id,
        groupId: groupId,
        role: 'OWNER'
      }
    })

    if (!userMembership) {
      return NextResponse.json({ 
        error: 'Access denied. Only group owners can update group settings.' 
      }, { status: 403 })
    }

    // Validate the data
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Group name is required' 
      }, { status: 400 })
    }

    if (name.trim().length > 50) {
      return NextResponse.json({ 
        error: 'Group name must be 50 characters or less' 
      }, { status: 400 })
    }

    // Update the group
    const updatedGroup = await prisma.budgetGroup.update({
      where: {
        id: groupId
      },
      data: {
        name: name.trim()
      }
    })

    return NextResponse.json({
      id: updatedGroup.id,
      name: updatedGroup.name,
      message: 'Group updated successfully'
    })

  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 