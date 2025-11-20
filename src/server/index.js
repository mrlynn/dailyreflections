/**
 * Custom server for Next.js with Socket.IO integration
 * This allows real-time communication between clients and server
 */
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { verify } from 'jsonwebtoken';
import cookie from 'cookie';

// Determine the environment
const dev = process.env.NODE_ENV !== 'production';
// Create the Next.js app
const app = next({ dev, dir: process.cwd() });
// Get the request handler
const handle = app.getRequestHandler();

// Prepare the Next.js app
app.prepare().then(() => {
  // Create the HTTP server
  const server = createServer(async (req, res) => {
    try {
      // Parse URL
      const parsedUrl = parse(req.url, true);

      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling the request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Initialize Socket.IO with CORS settings
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      allowedHeaders: ['content-type', 'authorization'],
      credentials: true
    },
    // Clean up disconnected sockets after 60 seconds
    cleanupEmptyChildNamespaces: true,
    pingTimeout: 60000,
  });

  // Create the chat namespace
  const chatNamespace = io.of('/chat');

  // Get the session token from cookies or auth header
  const getSessionToken = (socket) => {
    try {
      // Try to get from cookie
      if (socket.handshake.headers.cookie) {
        const cookies = cookie.parse(socket.handshake.headers.cookie);
        return cookies['next-auth.session-token'] ||
               cookies['__Secure-next-auth.session-token'];
      }

      // Try to get from auth header
      const authHeader = socket.handshake.auth.token ||
                         socket.handshake.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
      }

      return null;
    } catch (err) {
      console.error('Error getting session token:', err);
      return null;
    }
  };

  // Authentication middleware for Socket.IO
  chatNamespace.use((socket, next) => {
    try {
      const token = getSessionToken(socket);

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify the token
      verify(token, process.env.NEXTAUTH_SECRET, (err, decoded) => {
        if (err) {
          return next(new Error('Authentication error: Invalid token'));
        }

        // Store user data on the socket
        socket.user = {
          id: decoded.sub || decoded.id,
          email: decoded.email,
          name: decoded.name,
          displayName: decoded.displayName || decoded.name,
          roles: decoded.roles || [],
          isAdmin: decoded.isAdmin === true
        };

        // Check if user has volunteer_listener role or is admin
        const isVolunteer = socket.user.roles.includes('volunteer_listener');
        socket.isVolunteer = isVolunteer || socket.user.isAdmin;

        next();
      });
    } catch (err) {
      console.error('Socket authentication error:', err);
      next(new Error('Internal authentication error'));
    }
  });

  // Connected volunteers (volunteer_id => socket.id)
  const activeVolunteers = new Map();
  // User chat sessions (user_id => socket.id)
  const userSessions = new Map();
  // Volunteer-user chat pairs (socket.id => paired socket.id)
  const chatPairs = new Map();

  // Handle new connections
  chatNamespace.on('connection', (socket) => {
    console.log(`New socket connection: ${socket.id}, User: ${socket.user.email}`);

    // If user is a volunteer, track them as active
    if (socket.isVolunteer) {
      socket.join('volunteers');
      console.log(`Volunteer ${socket.user.displayName} (${socket.user.id}) connected`);
    }

    // Handle volunteer going live/offline
    socket.on('volunteer:status', (status) => {
      if (!socket.isVolunteer) return;

      if (status === 'online') {
        activeVolunteers.set(socket.user.id, socket.id);
        // Broadcast to users that a new volunteer is available
        chatNamespace.emit('volunteer:available', {
          count: activeVolunteers.size
        });
        console.log(`Volunteer ${socket.user.displayName} is now online. Active volunteers: ${activeVolunteers.size}`);
      } else if (status === 'offline') {
        activeVolunteers.delete(socket.user.id);
        // Broadcast that volunteer count has changed
        chatNamespace.emit('volunteer:available', {
          count: activeVolunteers.size
        });
        console.log(`Volunteer ${socket.user.displayName} is now offline. Active volunteers: ${activeVolunteers.size}`);
      }
    });

    // Handle chat requests from users
    socket.on('chat:request', (data) => {
      // Store user in the waiting room
      userSessions.set(socket.user.id, socket.id);
      socket.join('waiting');

      // Notify volunteers about new request
      chatNamespace.to('volunteers').emit('chat:new_request', {
        user_id: socket.user.id,
        user_name: socket.user.displayName,
        request_time: new Date().toISOString(),
        request_id: data.request_id || null
      });

      console.log(`Chat request from ${socket.user.displayName} (${socket.user.id})`);
    });

    // Handle volunteer accepting a chat
    socket.on('chat:accept', (data) => {
      if (!socket.isVolunteer) return;

      const userId = data.user_id;
      const userSocketId = userSessions.get(userId);

      if (!userSocketId) {
        socket.emit('chat:error', { message: 'User is no longer connected' });
        return;
      }

      const userSocket = chatNamespace.sockets.get(userSocketId);
      if (!userSocket) {
        socket.emit('chat:error', { message: 'User socket not found' });
        return;
      }

      // Create a chat room ID
      const roomId = `chat_${userId}_${socket.user.id}`;

      // Join both sockets to the room
      socket.join(roomId);
      userSocket.join(roomId);

      // Remove user from waiting room
      userSocket.leave('waiting');

      // Store the pairing
      chatPairs.set(socket.id, userSocketId);
      chatPairs.set(userSocketId, socket.id);

      // Notify both parties that chat has started
      socket.emit('chat:started', {
        room: roomId,
        user: {
          id: userSocket.user.id,
          displayName: userSocket.user.displayName
        },
        timestamp: new Date().toISOString()
      });

      userSocket.emit('chat:started', {
        room: roomId,
        volunteer: {
          id: socket.user.id,
          displayName: socket.user.displayName
        },
        timestamp: new Date().toISOString()
      });

      console.log(`Chat started: Volunteer ${socket.user.displayName} accepted chat with ${userSocket.user.displayName}`);
    });

    // Handle chat messages
    socket.on('chat:message', (data) => {
      if (!data.room || !data.message) return;

      // Get the paired socket
      const pairedSocketId = chatPairs.get(socket.id);
      if (!pairedSocketId) {
        socket.emit('chat:error', { message: 'No active chat session' });
        return;
      }

      // Create message object
      const message = {
        sender_id: socket.user.id,
        sender_name: socket.user.displayName,
        sender_type: socket.isVolunteer ? 'volunteer' : 'user',
        message: data.message,
        timestamp: new Date().toISOString()
      };

      // Broadcast to the room
      chatNamespace.to(data.room).emit('chat:message', message);
    });

    // Handle chat ending
    socket.on('chat:end', (data) => {
      if (!data.room) return;

      const pairedSocketId = chatPairs.get(socket.id);
      if (!pairedSocketId) return;

      const pairedSocket = chatNamespace.sockets.get(pairedSocketId);

      // Clean up the mapping
      chatPairs.delete(socket.id);
      chatPairs.delete(pairedSocketId);

      // Notify both parties that chat has ended
      const endEvent = {
        room: data.room,
        ended_by: socket.user.id,
        ended_by_type: socket.isVolunteer ? 'volunteer' : 'user',
        timestamp: new Date().toISOString()
      };

      socket.emit('chat:ended', endEvent);
      if (pairedSocket) {
        pairedSocket.emit('chat:ended', endEvent);
      }

      // Leave the room
      socket.leave(data.room);
      if (pairedSocket) {
        pairedSocket.leave(data.room);
      }

      console.log(`Chat ended in room ${data.room}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.isVolunteer) {
        activeVolunteers.delete(socket.user.id);
        chatNamespace.emit('volunteer:available', {
          count: activeVolunteers.size
        });
      } else {
        userSessions.delete(socket.user.id);
      }

      // Handle any active chat pairs
      const pairedSocketId = chatPairs.get(socket.id);
      if (pairedSocketId) {
        const pairedSocket = chatNamespace.sockets.get(pairedSocketId);
        if (pairedSocket) {
          pairedSocket.emit('chat:disconnected', {
            message: `${socket.user.displayName} has disconnected.`,
            timestamp: new Date().toISOString()
          });
        }
        chatPairs.delete(socket.id);
        chatPairs.delete(pairedSocketId);
      }

      console.log(`Socket disconnected: ${socket.id}, User: ${socket.user.email}`);
    });
  });

  // Start the server
  const PORT = parseInt(process.env.PORT, 10) || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Server listening on port ${PORT}`);
    console.log(`> WebSocket server enabled at ws://localhost:${PORT}`);
  });
});