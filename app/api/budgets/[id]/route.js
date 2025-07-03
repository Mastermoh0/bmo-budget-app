import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentMonth } from '@/lib/utils'

// Update budget amount for a specific category and month
export async function PUT(request, { params }) {
  try {
    const { id } = params // Changed from categoryId to id
    const body = await request.json()
    const { budgeted, month: monthParam, groupId = 'demo-group' } = body

    const month = monthParam ? new Date(monthParam) : getCurrentMonth()

    // Upsert budget entry (create if doesn't exist, update if it does)
    const budget = await prisma.budget.upsert({
      where: {
        groupId_categoryId_month: {
          groupId,
          categoryId: id, // Use id instead of categoryId
          month,
        },
      },
      update: {
        budgeted: parseFloat(budgeted),
        available: parseFloat(budgeted), // Simplified calculation for demo
      },
      create: {
        groupId,
        categoryId: id, // Use id instead of categoryId
        month,
        budgeted: parseFloat(budgeted),
        activity: 0,
        available: parseFloat(budgeted),
      },
    })

    return NextResponse.json(budget)
  } catch (error) {
    console.error('Failed to update budget:', error)
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 })
  }
} 