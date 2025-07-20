import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocket(groupId: string, userId: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const initSocket = () => {
      // Connect to separate Socket.io server
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
      
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        autoConnect: true
      })

      newSocket.on('connect', () => {
        console.log('Connected to Socket.IO server')
        setIsConnected(true)
        newSocket.emit('join-group', groupId)
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