import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocket(groupId: string, userId: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const initSocket = async () => {
      // Initialize Socket.IO server
      await fetch('/api/socket')
      
      const newSocket = io({
        path: '/api/socket',
        transports: ['websocket', 'polling'],
      })

      newSocket.on('connect', () => {
        console.log('Connected to Socket.IO server')
        setIsConnected(true)
        newSocket.emit('join-group', { groupId, userId })
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server')
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error)
        setIsConnected(false)
      })

      socketRef.current = newSocket
      setSocket(newSocket)
    }

    if (groupId && userId) {
      initSocket()
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [groupId, userId])

  return { socket, isConnected }
} 