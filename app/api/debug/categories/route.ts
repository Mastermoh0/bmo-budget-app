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

    console.log('🔍 Debug: Checking user:', session.user.id, session.user.email)

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        hasCompletedOnboarding: true,
        memberships: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                description: true,
                createdAt: true
              }
            }
          }
        }
      }
    })

    console.log('👤 User data:', JSON.stringify(user, null, 2))

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all budget groups for this user
    const budgetGroups = await prisma.budgetGroup.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        members: {
          where: { userId: session.user.id },
          select: { role: true }
        },
        _count: {
          select: {
            categoryGroups: true,
            categories: true
          }
        }
      }
    })

    console.log('🏢 Budget groups:', JSON.stringify(budgetGroups, null, 2))

    // Get category groups for each budget group
    const detailedGroups = await Promise.all(
      budgetGroups.map(async (budgetGroup) => {
        const categoryGroups = await prisma.categoryGroup.findMany({
          where: {
            groupId: budgetGroup.id,
            isHidden: false
          },
          include: {
            categories: {
              where: { isHidden: false },
              select: {
                id: true,
                name: true,
                createdAt: true,
                sortOrder: true
              },
              orderBy: { sortOrder: 'asc' }
            }
          },
          orderBy: { sortOrder: 'asc' }
        })

        console.log(`📁 Category groups for budget ${budgetGroup.id}:`, JSON.stringify(categoryGroups, null, 2))

        return {
          ...budgetGroup,
          categoryGroups
        }
      })
    )

    return NextResponse.json({
      debug: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        membershipCount: user.memberships.length
      },
      budgetGroups: detailedGroups,
      summary: {
        totalBudgetGroups: budgetGroups.length,
        totalCategoryGroups: detailedGroups.reduce((sum, bg) => sum + bg.categoryGroups.length, 0),
        totalCategories: detailedGroups.reduce((sum, bg) => 
          sum + bg.categoryGroups.reduce((catSum, cg) => catSum + cg.categories.length, 0), 0
        )
      }
    })
  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error.message },
      { status: 500 }
    )
  }
} 