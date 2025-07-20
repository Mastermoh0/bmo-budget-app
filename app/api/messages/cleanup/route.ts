import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/messages/cleanup - Clean up anonymized messages past retention period
export async function POST(request: NextRequest) {
  try {
    // Verify this is called from a trusted source (add auth header check if needed)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CLEANUP_TOKEN || 'cleanup-secret-token'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🧹 Starting message cleanup job...')

    // Find messages that are past their deletion time
    const messagesToDelete = await prisma.message.findMany({
      where: {
        isAnonymized: true,
        scheduledDelete: {
          lte: new Date() // Messages scheduled for deletion before now
        }
      },
      select: {
        id: true,
        groupId: true,
        scheduledDelete: true,
        createdAt: true
      }
    })

    if (messagesToDelete.length === 0) {
      console.log('✅ No messages to clean up')
      return NextResponse.json({ 
        success: true,
        message: 'No messages to clean up',
        deletedCount: 0
      })
    }

    // Group by budget group to respect individual retention policies
    const messagesByGroup = messagesToDelete.reduce((acc, msg) => {
      if (!acc[msg.groupId]) acc[msg.groupId] = []
      acc[msg.groupId].push(msg)
      return acc
    }, {} as Record<string, typeof messagesToDelete>)

    let totalDeleted = 0

    // Process each group separately
    for (const [groupId, messages] of Object.entries(messagesByGroup)) {
      try {
        // Get group retention policy
        const group = await prisma.budgetGroup.findUnique({
          where: { id: groupId },
          select: { 
            name: true,
            messageRetentionPolicy: true 
          }
        })

        if (!group) {
          console.log(`⚠️ Group ${groupId} not found, skipping messages`)
          continue
        }

        const retentionPolicy = group.messageRetentionPolicy as any
        const retentionHours = retentionPolicy?.anonymizedRetentionHours || 24

        // Double-check each message against the group's policy
        const messagesToDeleteNow = messages.filter(msg => {
          const hoursAnonymized = (Date.now() - new Date(msg.scheduledDelete).getTime() + (retentionHours * 60 * 60 * 1000)) / (1000 * 60 * 60)
          return hoursAnonymized >= retentionHours
        })

        if (messagesToDeleteNow.length === 0) {
          console.log(`✅ No messages ready for deletion in group ${group.name}`)
          continue
        }

        // Delete the messages
        const messageIds = messagesToDeleteNow.map(m => m.id)
        
        const deleteResult = await prisma.message.deleteMany({
          where: {
            id: { in: messageIds }
          }
        })

        totalDeleted += deleteResult.count
        console.log(`🗑️ Deleted ${deleteResult.count} anonymized messages from group "${group.name}"`)

      } catch (error) {
        console.error(`❌ Error cleaning up messages for group ${groupId}:`, error)
        // Continue with other groups even if one fails
      }
    }

    const result = {
      success: true,
      message: `Cleanup completed. Deleted ${totalDeleted} anonymized messages.`,
      deletedCount: totalDeleted,
      groupsProcessed: Object.keys(messagesByGroup).length,
      timestamp: new Date().toISOString()
    }

    console.log('✅ Message cleanup completed:', result)
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Message cleanup job failed:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Cleanup job failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET /api/messages/cleanup - Get cleanup status and scheduled messages
export async function GET(request: NextRequest) {
  try {
    // Verify this is called from a trusted source
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CLEANUP_TOKEN || 'cleanup-secret-token'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get statistics about anonymized messages
    const anonymizedMessages = await prisma.message.findMany({
      where: {
        isAnonymized: true
      },
      select: {
        id: true,
        groupId: true,
        anonymizedAt: true,
        scheduledDelete: true,
        group: {
          select: {
            name: true,
            messageRetentionPolicy: true
          }
        }
      }
    })

    const now = new Date()
    const readyForDeletion = anonymizedMessages.filter(msg => 
      msg.scheduledDelete && msg.scheduledDelete <= now
    )

    const pendingDeletion = anonymizedMessages.filter(msg => 
      msg.scheduledDelete && msg.scheduledDelete > now
    )

    // Group statistics
    const groupStats = anonymizedMessages.reduce((acc, msg) => {
      const groupId = msg.groupId
      if (!acc[groupId]) {
        acc[groupId] = {
          groupName: msg.group.name,
          totalAnonymized: 0,
          readyForDeletion: 0,
          pendingDeletion: 0,
          retentionPolicy: msg.group.messageRetentionPolicy
        }
      }
      
      acc[groupId].totalAnonymized++
      if (msg.scheduledDelete && msg.scheduledDelete <= now) {
        acc[groupId].readyForDeletion++
      } else if (msg.scheduledDelete && msg.scheduledDelete > now) {
        acc[groupId].pendingDeletion++
      }
      
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      success: true,
      statistics: {
        totalAnonymizedMessages: anonymizedMessages.length,
        readyForDeletion: readyForDeletion.length,
        pendingDeletion: pendingDeletion.length,
        groupCount: Object.keys(groupStats).length
      },
      groupDetails: groupStats,
      nextCleanupNeeded: pendingDeletion.length > 0 ? 
        Math.min(...pendingDeletion.map(m => m.scheduledDelete.getTime())) : null,
      timestamp: now.toISOString()
    })

  } catch (error) {
    console.error('Error getting cleanup status:', error)
    return NextResponse.json({ 
      error: 'Failed to get cleanup status',
      details: error.message
    }, { status: 500 })
  }
} 