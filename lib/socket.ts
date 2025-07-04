import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    console.log('Socket.IO server already running')
    res.end()
    return
  }

  console.log('Starting Socket.IO server...')
  
  const io = new SocketIOServer(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  })

  res.socket.server.io = io

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // Join a group room for messaging
    socket.on('join-group', async (data) => {
      const { groupId, userId } = data
      
      try {
        // Verify user is a member of the group
        const membership = await prisma.groupMember.findFirst({
          where: {
            userId: userId,
            groupId: groupId
          }
        })

        if (membership) {
          socket.join(`group-${groupId}`)
          console.log(`User ${userId} joined group ${groupId}`)
          
          // Notify other members that user is online
          socket.to(`group-${groupId}`).emit('user-online', {
            userId: userId,
            groupId: groupId
          })
        }
      } catch (error) {
        console.error('Error joining group:', error)
      }
    })

    // Handle sending messages
    socket.on('send-message', async (data) => {
      const { groupId, content, senderId, replyToId } = data
      
      try {
        // Verify user is a member of the group
        const membership = await prisma.groupMember.findFirst({
          where: {
            userId: senderId,
            groupId: groupId
          }
        })

        if (!membership) {
          socket.emit('error', { message: 'Not authorized to send messages in this group' })
          return
        }

        // Create the message in the database
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            senderId: senderId,
            groupId: groupId,
            replyToId: replyToId || null
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
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            },
            _count: {
              select: {
                replies: true
              }
            }
          }
        })

        // Broadcast the message to all members in the group
        io.to(`group-${groupId}`).emit('new-message', message)
        
      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { groupId, userId, isTyping } = data
      socket.to(`group-${groupId}`).emit('user-typing', {
        userId,
        isTyping
      })
    })

    // Handle user disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })

  res.end()
} 