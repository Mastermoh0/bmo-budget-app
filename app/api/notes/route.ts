import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const planId = url.searchParams.get('planId')

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Verify user has access to this plan
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: planId,
        user: { email: session.user.email }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch notes for this plan
    const notes = await prisma.note.findMany({
      where: {
        groupId: planId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        categoryGroup: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Failed to fetch notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, planId, categoryId, categoryGroupId } = await request.json()

    if (!content || !planId) {
      return NextResponse.json({ error: 'Content and plan ID are required' }, { status: 400 })
    }

    if (!categoryId && !categoryGroupId) {
      return NextResponse.json({ error: 'Either category ID or category group ID is required' }, { status: 400 })
    }

    // Verify user has access to this plan
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: planId,
        user: { email: session.user.email }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Verify the category or category group belongs to this plan
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          categoryGroup: {
            groupId: planId
          }
        }
      })

      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
    }

    if (categoryGroupId) {
      const categoryGroup = await prisma.categoryGroup.findFirst({
        where: {
          id: categoryGroupId,
          groupId: planId
        }
      })

      if (!categoryGroup) {
        return NextResponse.json({ error: 'Category group not found' }, { status: 404 })
      }
    }

    // Create the note
    const note = await prisma.note.create({
      data: {
        content,
        groupId: planId,
        categoryId: categoryId || null,
        categoryGroupId: categoryGroupId || null
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        categoryGroup: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Failed to create note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 