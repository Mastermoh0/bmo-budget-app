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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        hasCompletedOnboarding: true,
        onboardingData: true,
        createdAt: true,
        memberships: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                description: true,
                currency: true,
                _count: {
                  select: { members: true }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If user doesn't have a budget group, create one automatically
    let userWithBudgetGroup = user
    console.log('🔍 Profile API: User memberships count:', user.memberships.length)
    console.log('📋 Profile API: User memberships:', JSON.stringify(user.memberships, null, 2))
    
    if (user.memberships.length === 0) {
      console.log('⚠️ Profile API: User has no budget group, creating one automatically')
      
      const budgetGroup = await prisma.budgetGroup.create({
        data: {
          name: `${user.name || 'My'} Budget`,
          description: 'Your personal budget',
          members: {
            create: {
              userId: user.id,
              role: 'OWNER'
            }
          }
        },
        select: {
          id: true,
          name: true,
          description: true,
          currency: true,
          _count: {
            select: { members: true }
          }
        }
      })

      // Update the user object to include the new membership
      userWithBudgetGroup = {
        ...user,
        memberships: [{
          groupId: budgetGroup.id,
          role: 'OWNER' as const,
          group: budgetGroup
        }]
      }
      
      console.log('✅ Profile API: Created budget group:', budgetGroup.id)
    } else {
      console.log('✅ Profile API: User has existing budget groups')
    }

    // Format the response to include budget groups
    const profile = {
      id: userWithBudgetGroup.id,
      name: userWithBudgetGroup.name,
      email: userWithBudgetGroup.email,
      hasCompletedOnboarding: userWithBudgetGroup.hasCompletedOnboarding,
      onboardingData: userWithBudgetGroup.onboardingData,
      createdAt: userWithBudgetGroup.createdAt.toISOString(),
      budgets: userWithBudgetGroup.memberships.map(membership => ({
        id: membership.group.id,
        name: membership.group.name,
        description: membership.group.description,
        currency: membership.group.currency,
        role: membership.role,
        memberCount: membership.group._count.members
      }))
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email } = body

    // Validate inputs
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!email?.trim() || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        NOT: { id: session.user.id }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already taken by another account' },
        { status: 409 }
      )
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        memberships: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                description: true,
                currency: true,
                _count: {
                  select: { members: true }
                }
              }
            }
          }
        }
      }
    })

    const profile = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt.toISOString(),
      budgets: updatedUser.memberships.map(membership => ({
        id: membership.group.id,
        name: membership.group.name,
        description: membership.group.description,
        currency: membership.group.currency,
        role: membership.role,
        memberCount: membership.group._count.members
      }))
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
} 