import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('=== DEBUG USER ENDPOINT ===')
    
    const session = await getServerSession(authOptions)
    console.log('Session exists:', !!session)
    console.log('User ID:', session?.user?.id)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        status: 'No session',
        user: null,
        error: 'Not authenticated'
      })
    }

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        memberships: {
          include: {
            group: {
              include: {
                categoryGroups: true,
                budgetAccounts: true
              }
            }
          }
        },
        accounts: true,
        sessions: true
      }
    })
    console.log('User found:', !!user)

    // Check database connection
    const userCount = await prisma.user.count()
    const sessionCount = await prisma.session.count()

    return NextResponse.json({
      status: 'Debug info',
      timestamp: new Date().toISOString(),
      session: {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      userExists: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        accountsCount: user.accounts?.length || 0,
        sessionsCount: user.sessions?.length || 0,
        membershipsCount: user.memberships?.length || 0,
        onboardingData: user.onboardingData
      } : null,
      budgetGroups: user?.memberships?.map(m => ({
        groupId: m.groupId,
        groupName: m.group.name,
        role: m.role,
        joinedAt: m.joinedAt,
        categoryGroupsCount: m.group.categoryGroups?.length || 0,
        budgetAccountsCount: m.group.budgetAccounts?.length || 0
      })) || [],
      databaseConnection: 'Working',
      totalUsers: userCount,
      totalSessions: sessionCount,
      hasBudgetGroup: user?.memberships?.length > 0,
      recommendation: user ? 
        (user.memberships?.length > 0 ? 'User setup is complete' : 'User needs budget group creation') : 
        'User record is missing - sign out and sign in again'
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      status: 'Error',
      error: error.message,
      stack: error.stack,
      databaseConnection: 'Failed'
    }, { status: 500 })
  }
} 