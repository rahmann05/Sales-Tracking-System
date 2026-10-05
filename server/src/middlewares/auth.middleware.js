import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/errors.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Akses ditolak. Token autentikasi tidak ditemukan', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // { id, role, clusterId }
    next();
  } catch (error) {
    return next(new AppError('Token tidak valid atau telah kadaluwarsa', 401));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User tidak terautentikasi', 401));
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new AppError('Anda tidak memiliki izin untuk mengakses resource ini', 403));
    }
    next();
  };
};

export const authorizeWithPermission = (roles, permissionKey) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User tidak terautentikasi', 401));
    }
    
    // If user has the required role, allow
    if (roles.includes(req.user.role)) {
      return next();
    }
    
    // If user has the specific permission in JWT, allow
    const permissions = req.user.permissions || {};
    if (permissions[permissionKey]) {
      return next();
    }
    
    return next(new AppError(`Anda tidak memiliki izin untuk mengakses resource ini (Memerlukan role ${roles.join('/')} atau izin ${permissionKey})`, 403));
  };
};

export const requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('User tidak terautentikasi', 401));
      }
      
      const userRecord = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { permissions: true, role: true }
      });
      
      if (!userRecord) {
        return next(new AppError('User tidak ditemukan', 404));
      }
      
      // ADMIN roles bypass all permission checks
      if (userRecord.role === 'ADMIN') {
        return next();
      }

      const permissions = userRecord.permissions || {};
      if (!permissions[permissionKey]) {
        return next(new AppError(`Akses ditolak. Fitur ini memerlukan izin: ${permissionKey}`, 403));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
