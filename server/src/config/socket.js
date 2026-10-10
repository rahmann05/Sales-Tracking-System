import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma.js';
import { config } from './index.js';
import {invalidateConfigCache} from '../modules/config/services/dynamic-config.service.js';
import {invalidatePolicyCache} from '../modules/config/services/policy-resolver.service.js';

let io = null;

/**
 * Initialize Socket.IO with an existing HTTP server instance.
 * Must be called once in the app entry point.
 */
export const createSocketServer = (httpServer) => {
  const server = new Server(httpServer, {
    cors: {
      origin: config.env === 'development' ? true : config.clientOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  server.use(async (socket, next) => {
    try {
      const decoded = jwt.verify(socket.handshake.auth?.token, config.jwtSecret);
      const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true, deletedAt: true,tokenVersion:true } });
      if (!user || user.deletedAt || (decoded.tokenVersion||0)!==(user.tokenVersion||0)) throw new Error('Akun tidak aktif');
      socket.data.userId = user.id;
      next();
    } catch { next(new Error('Autentikasi socket diperlukan')); }
  });
  server.on('policy:invalidate',()=>{invalidateConfigCache();invalidatePolicyCache();});
  server.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);
    if (userId) {
      console.log(`[Socket.IO]: User ${userId} connected (socket: ${socket.id})`);
    }

    socket.on('disconnect', () => {
      if (userId) {
        console.log(`[Socket.IO]: User ${userId} disconnected`);
      }
    });
  });

  console.log('[Socket.IO]: Server initialized.');
  return server;
};
export const initSocket=httpServer=>{io=createSocketServer(httpServer);return io;};

/**
 * Emit a Socket.IO event to a specific user by userId.
 * Silently does nothing if the user is not connected.
 */
export const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
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
  if(['policies','config','configs'].includes(dataType))io.serverSideEmit('policy:invalidate');
  io.emit('cache:invalidate', { dataType, timestamp: Date.now() });
};
