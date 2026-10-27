'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Reply, MessageCircle, Download, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useSocket } from '@/hooks/useSocket'

interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string | null
  sender: {
    id: string
    name: string | null
    email: string
  } | null
  senderName: string | null
  senderEmail: string | null
  isAnonymized: boolean
  replyTo?: {
    id: string
    content: string
    sender: {
      id: string
      name: string | null
      email: string
    } | null
    senderName: string | null
  }
  _count: {
    replies: number
  }
}

interface TeamMessagingProps {
  groupId: string
  currentUserId: string
}

export function TeamMessaging({ groupId, currentUserId }: TeamMessagingProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [exporting, setExporting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { socket, isConnected } = useSocket(groupId, currentUserId)

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return

    socket.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message])
      scrollToBottom()
    })

    return () => {
      socket.off('new-message')
    }
  }, [socket, currentUserId])

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?groupId=${groupId}`)
        const data = await response.json()
        if (response.ok) {
          setMessages(data.messages)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [groupId])

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      // Try to send via socket first (real-time)
      if (socket && isConnected) {
        socket.emit('send-message', {
          groupId,
          content: newMessage,
          senderId: currentUserId,
          replyToId: replyTo?.id
        })
      } else {
        // Fallback to direct API call if socket is not connected
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groupId,
            content: newMessage,
            replyToId: replyTo?.id
          }),
        })

        if (response.ok) {
          const data = await response.json()
          // Add message to local state immediately for better UX
          setMessages(prev => [...prev, data.message])
          scrollToBottom()
        } else {
          throw new Error('Failed to send message')
        }
      }
      
      setNewMessage('')
      setReplyTo(null)
    } catch (error) {
      console.error('Error sending message:', error)
      // Could add toast notification here
    } finally {
      setSending(false)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Export messages
  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true)
    try {
      const response = await fetch(`/api/messages/export?groupId=${groupId}&format=${format}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Get filename from Content-Disposition header or create default
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `messages-${new Date().toISOString().split('T')[0]}.${format}`
        
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const error = await response.json()
        console.error('Export failed:', error.error)
      }
    } catch (error) {
      console.error('Error exporting messages:', error)
    } finally {
      setExporting(false)
    }
  }

  // Get display name for message sender
  const getSenderDisplayName = (message: Message) => {
    if (message.isAnonymized) {
      return message.senderName || '[Removed User]'
    }
    return message.sender?.name || message.sender?.email || '[Unknown User]'
  }

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Team Messages</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('json')}
              disabled={exporting || messages.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={exporting || messages.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Chat with your team members in real-time. Messages from removed users are preserved for context.
        </p>
      </div>

      {/* Connection Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MessageCircle className="w-4 h-4" />
            <span>Team Chat</span>
            {messages.some(m => m.isAnonymized) && (
              <span className="text-amber-600 text-xs">
                • Contains messages from removed users
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </Card>

      {/* Messages Container */}
      <Card className="p-4">
        <div className="h-96 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === currentUserId
                      ? 'bg-blue-600 text-white'
                      : message.isAnonymized
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {/* Reply indicator */}
                  {message.replyTo && (
                    <div className="text-xs opacity-75 mb-1 p-2 bg-black bg-opacity-10 rounded">
                      <div className="font-medium">
                        Replying to {message.replyTo.senderName || message.replyTo.sender?.name || '[Removed User]'}
                      </div>
                      <div className="truncate">
                        {message.replyTo.content}
                      </div>
                    </div>
                  )}
                  
                  {/* Sender name (for others' messages) */}
                  {message.senderId !== currentUserId && (
                    <div className="text-xs font-medium mb-1 flex items-center space-x-1">
                      <span>{getSenderDisplayName(message)}</span>
                      {message.isAnonymized && (
                        <span className="text-xs opacity-75">(removed user)</span>
                      )}
                    </div>
                  )}
                  
                  {/* Message content */}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Message footer */}
                  <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                    <span>{formatTime(message.createdAt)}</span>
                    {message.senderId !== currentUserId && !message.isAnonymized && (
                      <button
                        onClick={() => setReplyTo(message)}
                        className="hover:opacity-100 transition-opacity"
                      >
                        <Reply className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply indicator */}
        {replyTo && (
          <div className="bg-gray-50 p-3 rounded-lg mb-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Replying to {getSenderDisplayName(replyTo)}
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {replyTo.content}
                </div>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Message input */}
        <div className="flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
} 