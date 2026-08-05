import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-access-token-key',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-token-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  attendanceRadiusMeters: parseFloat(process.env.ATTENDANCE_RADIUS_METERS || '100'),
};
