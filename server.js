const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;
// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });
  // Initialize Socket.IO on the same HTTP server
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? "http://localhost:3000" : false,
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/api/socket/io',
    addTrailingSlash: false,
  });
  // Socket.IO connection handling
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId || socket.handshake.auth.token || 'guest';
    console.log(`✅ Client connected: ${userId} (Socket ID: ${socket.id})`);
    // Handle authentication
    socket.on('authenticate', (data) => {
      console.log(`User ${userId} authenticated`);
      socket.join(`user:${userId}`);
    });

    // Handle incoming messages
    socket.on('message', (data) => {
      try {
        console.log(`📨 Message from ${userId}:`, data);
        // Broadcast to all clients except sender
        if (data.type === 'message') {
          socket.broadcast.emit('message', {
            from: userId,
            content: data.content,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('❌ Error handling message:', error);
        socket.emit('error', { message: 'Failed to process message' });
      }
    });

    // Handle client disconnection
    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected: ${userId} (Reason: ${reason})`);
    });

    // Send welcome message
    socket.emit('welcome', {
      message: 'Connected to WebSocket server',
      userId: userId,
      timestamp: new Date().toISOString()
    });
  });

  // Start the server
  httpServer
    .once('error', (err) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🚀 Server ready on http://${hostname}:${port}`);
      console.log(`🔌 Socket.IO server running on path /api/socket/io`);
    });
});
