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

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      let budgetGroupId;

      if (planId) {
        // Verify user has access to the specified plan
        const membership = await tx.groupMember.findFirst({
          where: { 
            userId: session.user.id,
            groupId: planId
          }
        })
        
        if (!membership) {
          throw new Error('Plan not found or access denied')
        }
        budgetGroupId = planId
      } else {
        // Get or create a default budget group
        const defaultGroup = await tx.groupMember.findFirst({
          where: { userId: session.user.id },
          select: { groupId: true }
        })

        if (defaultGroup) {
          budgetGroupId = defaultGroup.groupId
        } else {
          // Don't auto-create budget groups - require explicit plan ID
          throw new Error('No budget plan found. Please complete onboarding first.')
        }
      }

      console.log('Creating category group:', name, 'in budget group:', budgetGroupId)

      // Create the category group
      const categoryGroup = await tx.categoryGroup.create({
        data: {
          name,
          groupId: budgetGroupId,
          sortOrder: 999, // Will be at the end by default
        },
        include: {
          categories: true,
        },
      })

      console.log('Successfully created category group:', categoryGroup.id)
      return categoryGroup
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Failed to create category group - Detailed error:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    if (error.message === 'Plan not found or access denied') {
      return NextResponse.json({ 
        error: 'Plan not found or access denied',
        details: 'You do not have access to this budget plan.'
      }, { status: 403 })
    }
    
    // Return more specific error information
    return NextResponse.json({ 
      error: 'Failed to create category group',
      details: error.message,
      errorCode: error.code || 'UNKNOWN'
    }, { status: 500 })
  }
} 