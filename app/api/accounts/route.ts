import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for planId parameter to fetch accounts from specific plan
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId')

    let userMembership;

    if (planId) {
      // Get membership for the specific plan if planId is provided
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
    } else {
      // Default: get accounts from user's first plan (shared across all plans)
      userMembership = await prisma.groupMember.findFirst({
        where: { userId: session.user.id },
        include: { group: true },
        orderBy: { joinedAt: 'asc' } // Get the first plan (from onboarding)
      })

      if (!userMembership) {
        // Return empty accounts if user doesn't have a budget group yet
        return NextResponse.json([])
      }
    }

    const accounts = await prisma.budgetAccount.findMany({
      where: {
        groupId: userMembership.groupId, // Use the determined group ID
      },
      orderBy: [
        { isOnBudget: 'desc' }, // Budget accounts first
        { isClosed: 'asc' },    // Active accounts before closed
        { type: 'asc' },
        { name: 'asc' },
      ],
    })

    // Convert Decimal balances to numbers to prevent string concatenation issues
    const accountsWithNumberBalances = accounts.map(account => ({
      ...account,
      balance: Number(account.balance)
    }))

    return NextResponse.json(accountsWithNumberBalances)
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

    const body = await request.json()
    const { 
      name, 
      type, 
      balance = 0, 
      isOnBudget = true,
      isClosed = false,
      institution,
      accountNumber,
      planId // Get the planId from request body
    } = body

    let budgetGroupId;
    let userMembership;

    if (planId) {
      // If planId is provided, create account in that specific plan
      userMembership = await prisma.groupMember.findFirst({
        where: { 
          userId: session.user.id,
          groupId: planId 
        },
        include: { group: true }
      })
      
      if (!userMembership) {
        return NextResponse.json({ 
          error: 'Plan not found or access denied',
          details: 'You are not a member of this budget plan.' 
        }, { status: 404 })
      }
      
      budgetGroupId = userMembership.groupId
      console.log(`💾 Creating account in specific plan: ${planId}`)
    } else {
      // Fallback: add accounts to user's first plan (shared across all plans)
      userMembership = await prisma.groupMember.findFirst({
        where: { userId: session.user.id },
        include: { group: true },
        orderBy: { joinedAt: 'asc' } // Get the first plan (from onboarding)
      })

      budgetGroupId = userMembership?.groupId
      console.log(`💾 Creating account in default (first) plan: ${budgetGroupId}`)
    }

    // If user doesn't have a budget group, they need to complete onboarding first
    if (!userMembership) {
      return NextResponse.json({ 
        error: 'No budget plan found',
        details: 'Please complete onboarding to create your first budget plan.'
      }, { status: 404 })
    } else {
      // Check if user has permission to create accounts (VIEWER role cannot modify)
      if (userMembership.role === 'VIEWER') {
        return NextResponse.json({ 
          error: 'Access denied. Viewers cannot create or modify accounts.',
          userRole: userMembership.role 
        }, { status: 403 })
      }
    }

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

    // Convert Decimal balance to number to prevent string concatenation issues
    const accountWithNumberBalance = {
      ...account,
      balance: Number(account.balance)
    }

    return NextResponse.json(accountWithNumberBalance, { status: 201 })
  } catch (error) {
    console.error('Failed to create account:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
} 