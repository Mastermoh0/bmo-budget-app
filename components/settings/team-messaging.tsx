'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Reply, Users, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useSocket } from '@/hooks/useSocket'

interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string
  sender: {
    id: string
    name: string | null
    email: string
  }
  replyTo?: {
    id: string
    content: string
    sender: {
      id: string
      name: string | null
      email: string
    }
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
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { socket, isConnected } = useSocket(groupId, currentUserId)

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return

    socket.on('new-message', (message: Message) => {
      setMessages(prev => [message, ...prev])
      scrollToBottom()
    })

    socket.on('user-online', (data) => {
      setOnlineUsers(prev => new Set(prev).add(data.userId))
    })

    socket.on('user-typing', (data) => {
      if (data.userId !== currentUserId) {
        if (data.isTyping) {
          setTypingUsers(prev => new Set(prev).add(data.userId))
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.userId)
            return newSet
          })
        }
      }
    })

    return () => {
      socket.off('new-message')
      socket.off('user-online')
      socket.off('user-typing')
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

  // Handle typing indicator
  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', { groupId, userId: currentUserId, isTyping: true })
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { groupId, userId: currentUserId, isTyping: false })
      }, 1000)
    }
  }

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      if (socket) {
        socket.emit('send-message', {
          groupId,
          content: newMessage,
          senderId: currentUserId,
          replyToId: replyTo?.id
        })
      }
      
      setNewMessage('')
      setReplyTo(null)
    } catch (error) {
      console.error('Error sending message:', error)
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Messages</h3>
        <p className="text-sm text-gray-600">
          Chat with your team members in real-time.
        </p>
      </div>

      {/* Online Users Indicator */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{onlineUsers.size} member{onlineUsers.size !== 1 ? 's' : ''} online</span>
            {typingUsers.size > 0 && (
              <span className="text-blue-600 italic">
                {typingUsers.size} user{typingUsers.size !== 1 ? 's' : ''} typing...
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
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {/* Reply indicator */}
                  {message.replyTo && (
                    <div className="text-xs opacity-75 mb-1 p-2 bg-black bg-opacity-10 rounded">
                      <div className="font-medium">
                        Replying to {message.replyTo.sender.name || message.replyTo.sender.email}
                      </div>
                      <div className="truncate">
                        {message.replyTo.content}
                      </div>
                    </div>
                  )}
                  
                  {/* Sender name (for others' messages) */}
                  {message.senderId !== currentUserId && (
                    <div className="text-xs font-medium mb-1">
                      {message.sender.name || message.sender.email}
                    </div>
                  )}
                  
                  {/* Message content */}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Timestamp and actions */}
                  <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                    <span>{formatTime(message.createdAt)}</span>
                    {message.senderId !== currentUserId && (
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
                  Replying to {replyTo.sender.name || replyTo.sender.email}
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
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
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