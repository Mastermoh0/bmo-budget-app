#!/usr/bin/env node

const fetch = require('node-fetch')

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
const CLEANUP_TOKEN = process.env.CLEANUP_TOKEN || 'cleanup-secret-token'

async function runCleanup() {
  console.log('🧹 Running message cleanup job...')
  console.log(`Using base URL: ${BASE_URL}`)
  
  try {
    // First, get cleanup status
    console.log('\n📊 Getting cleanup status...')
    const statusResponse = await fetch(`${BASE_URL}/api/messages/cleanup`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLEANUP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.statusText}`)
    }

    const status = await statusResponse.json()
    console.log('📈 Current status:')
    console.log(`  • Total anonymized messages: ${status.statistics.totalAnonymizedMessages}`)
    console.log(`  • Ready for deletion: ${status.statistics.readyForDeletion}`)
    console.log(`  • Pending deletion: ${status.statistics.pendingDeletion}`)
    console.log(`  • Groups with anonymized messages: ${status.statistics.groupCount}`)

    if (status.statistics.readyForDeletion === 0) {
      console.log('\n✅ No messages ready for cleanup at this time.')
      return
    }

    // Run the cleanup
    console.log('\n🗑️ Running cleanup...')
    const cleanupResponse = await fetch(`${BASE_URL}/api/messages/cleanup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLEANUP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!cleanupResponse.ok) {
      throw new Error(`Cleanup failed: ${cleanupResponse.statusText}`)
    }

    const result = await cleanupResponse.json()
    console.log('✅ Cleanup completed:')
    console.log(`  • Messages deleted: ${result.deletedCount}`)
    console.log(`  • Groups processed: ${result.groupsProcessed}`)
    console.log(`  • Timestamp: ${result.timestamp}`)

  } catch (error) {
    console.error('❌ Cleanup job failed:', error.message)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Cleanup job interrupted')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Cleanup job terminated')
  process.exit(0)
})

// Run the cleanup
runCleanup().then(() => {
  console.log('\n🎉 Cleanup job finished successfully')
  process.exit(0)
}) 