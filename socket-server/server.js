const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = createServer(app);

// Configure CORS
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://*.vercel.app',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
};

app.use(cors(corsOptions));

const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Socket.io Server Running' });
});

// Socket handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-group', (groupId) => {
    socket.join(`group-${groupId}`);
  });

  socket.on('send-message', (data) => {
    const { groupId, message } = data;
    socket.to(`group-${groupId}`).emit('new-message', message);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
}); 