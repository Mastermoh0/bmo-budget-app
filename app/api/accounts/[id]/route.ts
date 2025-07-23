import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: 'No budget group found' }, { status: 404 })
    }

    const account = await prisma.budgetAccount.findUnique({
      where: {
        id: params.id,
        groupId: userMembership.groupId, // Use the user's actual group ID
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Convert Decimal balance to number to prevent string concatenation issues
    const accountWithNumberBalance = {
      ...account,
      balance: Number(account.balance)
    }

    return NextResponse.json(accountWithNumberBalance)
  } catch (error) {
    console.error('Failed to fetch account:', error)
    return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId } = body // Get planId from request body
    
    let userMembership;

    if (planId) {
      // Check user's role for the specific plan
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
    } else {
      // Fallback: use first plan (for backward compatibility)
      userMembership = await prisma.groupMember.findFirst({
        where: { userId: session.user.id },
        include: { group: true }
      })

      if (!userMembership) {
        return NextResponse.json({ error: 'No budget group found' }, { status: 404 })
      }
    }

    // Check if user has permission to modify accounts (VIEWER role cannot modify)
    if (userMembership.role === 'VIEWER') {
      return NextResponse.json({ 
        error: `Access denied. Viewers cannot modify accounts. Your role in this plan: ${userMembership.role}`,
        userRole: userMembership.role,
        planId: userMembership.groupId 
      }, { status: 403 })
    }

    const { 
      name, 
      type, 
      balance, 
      isOnBudget,
      isClosed,
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

    const account = await prisma.budgetAccount.update({
      where: {
        id: params.id,
        groupId: userMembership.groupId, // Use the user's actual group ID
      },
      data: {
        name,
        type,
        balance: parseFloat(balance.toString()),
        isOnBudget,
        isClosed,
        institution: institution || null,
        accountNumber: accountNumber || null,
      },
    })

    // Convert Decimal balance to number to prevent string concatenation issues
    const accountWithNumberBalance = {
      ...account,
      balance: Number(account.balance)
    }

    return NextResponse.json(accountWithNumberBalance)
  } catch (error) {
    console.error('Failed to update account:', error)
    
    // Handle case where account doesn't exist
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }
    
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the planId from query parameters (sent by frontend)
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId')

    let userMembership;

    if (planId) {
      // Check user's role for the specific plan
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
    } else {
      // Fallback: use first plan (for backward compatibility)
      userMembership = await prisma.groupMember.findFirst({
        where: { userId: session.user.id },
        include: { group: true }
      })

      if (!userMembership) {
        return NextResponse.json({ error: 'No budget group found' }, { status: 404 })
      }
    }

    // Check if user has permission to delete accounts (VIEWER role cannot modify)
    if (userMembership.role === 'VIEWER') {
      return NextResponse.json({ 
        error: `Access denied. Viewers cannot delete accounts. Your role in this plan: ${userMembership.role}`,
        userRole: userMembership.role,
        planId: userMembership.groupId 
      }, { status: 403 })
    }

    // Check if account has transactions
    const transactionCount = await prisma.transaction.count({
      where: {
        OR: [
          { fromAccountId: params.id },
          { toAccountId: params.id },
        ],
      },
    })

    if (transactionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with existing transactions. Please close the account instead.' },
        { status: 400 }
      )
    }

    await prisma.budgetAccount.delete({
      where: {
        id: params.id,
        groupId: userMembership.groupId, // Use the user's actual group ID
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete account:', error)
    
    // Handle case where account doesn't exist
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }
    
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
} 