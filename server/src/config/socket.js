import { Server } from 'socket.io';
import { config } from './index.js';

let io = null;
const userSocketMap = new Map();

/**
 * Initialize Socket.IO with an existing HTTP server instance.
 * Must be called once in the app entry point.
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`[Socket.IO]: User ${userId} connected (socket: ${socket.id})`);
    }

    socket.on('disconnect', () => {
      if (userId) {
        userSocketMap.delete(userId);
        console.log(`[Socket.IO]: User ${userId} disconnected`);
      }
    });
  });

  console.log('[Socket.IO]: Server initialized.');
  return io;
};

/**
 * Emit a Socket.IO event to a specific user by userId.
 * Silently does nothing if the user is not connected.
 */
export const emitToUser = (userId, event, payload) => {
  if (!io) return;
  const socketId = userSocketMap.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, payload);
  }
};

/**
 * Get the initialized Socket.IO server instance.
 */
export const getIo = () => io;

/**
 * Broadcast cache invalidation to all connected clients
 * @param {string} dataType - e.g., 'outlets', 'clusters', 'users', 'routes'
 */
export const broadcastCacheInvalidation = (dataType) => {
  if (!io) return;
  io.emit('cache:invalidate', { dataType, timestamp: Date.now() });
};
