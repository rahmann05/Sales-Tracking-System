import { prisma } from '../../config/prisma.js';
import { config } from '../../config/index.js';
import { getIo } from '../../config/socket.js';
import { AppError } from '../../utils/errors.js';
import { loginUser, refreshAccessToken } from './auth.service.js';
import { successResponse } from '../../utils/response.js';

const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const readCookie = (cookieHeader, name) => {
  if (typeof cookieHeader !== 'string' || !cookieHeader) return '';
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) {
      const raw = part.slice(idx + 1).trim();
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return '';
};

const refreshCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: config.env === 'production',
  path: '/api/v1/auth',
});

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    if (result?.refreshToken && typeof res.cookie === 'function') {
      res.cookie('refreshToken', result.refreshToken, {
        ...refreshCookieOptions(),
        maxAge: REFRESH_COOKIE_MAX_AGE_MS,
      });
    }
    return successResponse(res, 200, result, 'Login berhasil');
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.body?.refreshToken || readCookie(req.headers?.cookie, 'refreshToken');
    if (!token) {
      throw new AppError('Refresh token wajib diisi', 400);
    }
    const result = await refreshAccessToken(token);
    return successResponse(res, 200, result, 'Access token diperbarui');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await prisma.user.updateMany({
      where: { id: req.user.id, tokenVersion: req.user.tokenVersion || 0 },
      data: { tokenVersion: { increment: 1 } },
    });
    getIo()?.in(`user:${req.user.id}`).disconnectSockets(true);
    if (typeof res.clearCookie === 'function') {
      res.clearCookie('refreshToken', refreshCookieOptions());
    }
    return successResponse(res, 200, null, 'Logout berhasil; seluruh sesi akun telah dicabut');
  } catch (error) {
    next(error);
  }
};
