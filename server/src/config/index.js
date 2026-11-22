import dotenv from 'dotenv';

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || 'super-secret-access-token-key';
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-token-key';

if (env === 'production') {
  if (
    !process.env.JWT_SECRET ||
    jwtSecret === 'super-secret-access-token-key' ||
    jwtSecret.length < 32
  ) {
    throw new Error('JWT_SECRET harus diset minimal 32 karakter pada mode production');
  }
}

export const parseClientOrigin = (mode, rawOrigin) => {
  if (!rawOrigin || rawOrigin === '*') {
    return mode === 'production' ? false : true;
  }
  return rawOrigin.includes(',')
    ? rawOrigin
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : rawOrigin.trim();
};

export const config = {
  port: process.env.PORT || 5000,
  env,
  clientOrigin: parseClientOrigin(env, process.env.CLIENT_ORIGIN),
  jwtSecret,
  jwtRefreshSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  attendanceRadiusMeters: parseFloat(process.env.ATTENDANCE_RADIUS_METERS || '100'),
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  validationDistanceWarning: parseFloat(process.env.VALIDATION_DISTANCE_WARNING || '200'),
  validationDistanceSuspect: parseFloat(process.env.VALIDATION_DISTANCE_SUSPECT || '500'),
};
