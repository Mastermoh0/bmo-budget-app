import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's budget group
    const userMembership = await prisma.groupMember.findFirst({
      where: { userId: session.user.id },
      include: { group: true }
    })

    if (!userMembership) {
      // Return empty categories if user doesn't have a budget group yet
      return NextResponse.json([])
    }

    const categoryGroups = await prisma.categoryGroup.findMany({
      where: {
        groupId: userMembership.groupId,
        isHidden: false,
      },
      include: {
        categories: {
          where: { isHidden: false },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(categoryGroups)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/categories - Starting request')
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.id ? 'authenticated' : 'not authenticated')
    
    if (!session?.user?.id) {
      console.log('Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, planId } = body
    console.log('Request body:', body)

    // First, ensure the user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true }
    })

    if (!user) {
      console.log('User not found in database, session user ID:', session.user.id)
      return NextResponse.json({ 
        error: 'User not found in database',
        details: 'Your user record is missing. Please sign out and sign in again.',
        sessionUserId: session.user.id
      }, { status: 400 })
    }

    console.log('User found:', user)

    let budgetGroupId;
    let userMembership;

    if (planId) {
      // Get specific budget group membership if planId is provided
      userMembership = await prisma.groupMember.findFirst({
        where: { 
          userId: session.user.id,
          groupId: planId
        },
        include: { group: true }
      })
      
      if (!userMembership) {
        return NextResponse.json({ error: 'Plan not found or access denied' }, { status: 404 })
      }
      budgetGroupId = userMembership.groupId
    } else {
      // Get the user's first budget group (backward compatibility)
      userMembership = await prisma.groupMember.findFirst({
        where: { userId: session.user.id },
        include: { group: true }
      })
      budgetGroupId = userMembership?.groupId
    }

    console.log('User membership found:', !!userMembership)

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      let groupId = budgetGroupId

      // If user doesn't have a budget group, create one
      if (!userMembership) {
        console.log('Creating new budget group for user')
        // Use the already validated user data
        const userProfile = user

        const budgetGroup = await tx.budgetGroup.create({
          data: {
            name: `${userProfile?.name || 'My'} Budget`,
            description: 'Your personal budget',
            members: {
              create: {
                userId: session.user.id,
                role: 'OWNER'
              }
            }
          }
        })
        groupId = budgetGroup.id
        console.log('Created new budget group:', groupId)
      }

      console.log('Creating category group:', name, 'in budget group:', groupId)

      const categoryGroup = await tx.categoryGroup.create({
        data: {
          name,
          groupId,
          sortOrder: 999, // Will be at the end by default
        },
        include: {
          categories: true,
        },
      })

      console.log('Successfully created category group:', categoryGroup.id)
      return categoryGroup
    })

    const categoryGroup = result

    return NextResponse.json(categoryGroup, { status: 201 })
  } catch (error) {
    console.error('Failed to create category group - Detailed error:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    // Return more specific error information
    return NextResponse.json({ 
      error: 'Failed to create category group',
      details: error.message,
      errorCode: error.code || 'UNKNOWN'
    }, { status: 500 })
  }
} 