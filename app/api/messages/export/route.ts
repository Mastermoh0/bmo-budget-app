import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/messages/export - Export message history for a group
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const format = searchParams.get('format') || 'json' // json, csv

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Verify user is a member of the group
    const membership = await prisma.groupMember.findFirst({
      where: {
        userId: session.user.id,
        groupId: groupId
      },
      include: {
        group: {
          select: {
            name: true,
            messageRetentionPolicy: true
          }
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    // Check if group allows member export
    const retentionPolicy = membership.group.messageRetentionPolicy as any
    if (!retentionPolicy?.allowMemberExport && membership.role !== 'OWNER') {
      return NextResponse.json({ 
        error: 'Message export is not allowed for this group. Contact the group owner.' 
      }, { status: 403 })
    }

    // Get all messages for the group including anonymized ones
    const messages = await prisma.message.findMany({
      where: {
        groupId: groupId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderName: true,
            sender: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Chronological order for export
      }
    })

    // Transform messages for export
    const exportData = messages.map(message => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      sender: {
        name: message.isAnonymized 
          ? message.senderName 
          : (message.sender?.name || 'Unknown User'),
        email: message.isAnonymized 
          ? message.senderEmail 
          : (message.sender?.email || 'unknown@example.com'),
        isAnonymized: message.isAnonymized
      },
      replyTo: message.replyTo ? {
        id: message.replyTo.id,
        content: message.replyTo.content,
        createdAt: message.replyTo.createdAt.toISOString(),
        senderName: message.replyTo.senderName || message.replyTo.sender?.name || 'Unknown User'
      } : null,
      isRead: message.isRead
    }))

    // Get group metadata
    const groupInfo = {
      id: groupId,
      name: membership.group.name,
      exportedAt: new Date().toISOString(),
      exportedBy: {
        name: session.user.name,
        email: session.user.email
      },
      messageCount: exportData.length,
      dateRange: exportData.length > 0 ? {
        oldest: exportData[0].createdAt,
        newest: exportData[exportData.length - 1].createdAt
      } : null
    }

    if (format === 'csv') {
      // Generate CSV format
      const csvHeaders = [
        'Date',
        'Sender Name', 
        'Sender Email',
        'Message Content',
        'Reply To Message',
        'Is Anonymized'
      ]

      const csvRows = exportData.map(msg => [
        msg.createdAt,
        msg.sender.name,
        msg.sender.email,
        `"${msg.content.replace(/"/g, '""')}"`, // Escape quotes in CSV
        msg.replyTo ? `"${msg.replyTo.content.replace(/"/g, '""')}"` : '',
        msg.sender.isAnonymized ? 'Yes' : 'No'
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${membership.group.name}-messages-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Default JSON format
    const jsonExport = {
      metadata: groupInfo,
      messages: exportData
    }

    return new NextResponse(JSON.stringify(jsonExport, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${membership.group.name}-messages-${new Date().toISOString().split('T')[0]}.json"`
      }
    })

  } catch (error) {
    console.error('Error exporting messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/messages/export - Update group message retention policy (OWNERS only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { groupId, retentionPolicy } = await request.json()

    if (!groupId || !retentionPolicy) {
      return NextResponse.json({ error: 'Group ID and retention policy are required' }, { status: 400 })
    }

    // Verify user is an OWNER of the group
    const membership = await prisma.groupMember.findFirst({
      where: {
        userId: session.user.id,
        groupId: groupId,
        role: 'OWNER'
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Only group owners can update retention policies' }, { status: 403 })
    }

    // Validate retention policy structure
    const validPolicy = {
      anonymizedRetentionHours: Number(retentionPolicy.anonymizedRetentionHours) || 24,
      allowMemberExport: Boolean(retentionPolicy.allowMemberExport),
      warnOnUserDeletion: Boolean(retentionPolicy.warnOnUserDeletion)
    }

    // Update the group's retention policy
    await prisma.budgetGroup.update({
      where: { id: groupId },
      data: {
        messageRetentionPolicy: validPolicy
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Message retention policy updated successfully',
      policy: validPolicy
    })

  } catch (error) {
    console.error('Error updating retention policy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 