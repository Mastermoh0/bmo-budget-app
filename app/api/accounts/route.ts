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
      // Return empty accounts if user doesn't have a budget group yet
      return NextResponse.json([])
    }

    const accounts = await prisma.budgetAccount.findMany({
      where: {
        groupId: userMembership.groupId,
      },
      orderBy: [
        { isOnBudget: 'desc' }, // Budget accounts first
        { isClosed: 'asc' },    // Active accounts before closed
        { type: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Failed to fetch accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Get the user's budget group
    const userMembership = await prisma.groupMember.findFirst({
      where: { userId: session.user.id },
      include: { group: true }
    })

    let budgetGroupId = userMembership?.groupId

    // If user doesn't have a budget group, create one
    if (!userMembership) {
      const userProfile = user

      const budgetGroup = await prisma.budgetGroup.create({
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
      budgetGroupId = budgetGroup.id
    }

    const body = await request.json()
    const { 
      name, 
      type, 
      balance = 0, 
      isOnBudget = true,
      isClosed = false,
      institution,
      accountNumber
    } = body

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' }, 
        { status: 400 }
      )
    }

    const account = await prisma.budgetAccount.create({
      data: {
        name,
        type,
        balance: parseFloat(balance.toString()),
        isOnBudget,
        isClosed,
        institution: institution || null,
        accountNumber: accountNumber || null,
        groupId: budgetGroupId,
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Failed to create account:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
} 