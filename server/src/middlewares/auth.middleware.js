import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
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
