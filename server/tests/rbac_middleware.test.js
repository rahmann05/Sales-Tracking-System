import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authenticate, authorize } from '../src/middlewares/auth.middleware.js';
import { config } from '../src/config/index.js';
import { AppError } from '../src/utils/errors.js';

describe('Auth & RBAC Middleware Unit Tests', () => {
  describe('authenticate Middleware', () => {
    it('should reject request without authorization header (401)', () => {
      const req = { headers: {} };
      const res = {};
      let caughtError = null;

      authenticate(req, res, (err) => {
        caughtError = err;
      });

      assert.ok(caughtError instanceof AppError);
      assert.equal(caughtError.statusCode, 401);
      assert.ok(caughtError.message.includes('Token autentikasi tidak ditemukan'));
    });

    it('should reject request with invalid JWT token (401)', () => {
      const req = { headers: { authorization: 'Bearer invalid.fake.token' } };
      const res = {};
      let caughtError = null;

      authenticate(req, res, (err) => {
        caughtError = err;
      });

      assert.ok(caughtError instanceof AppError);
      assert.equal(caughtError.statusCode, 401);
    });

    it('should successfully decode valid JWT token and populate req.user', () => {
      const payload = { id: 'usr-123', role: 'SUPERVISOR', clusterId: 'cluster-cmh' };
      const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      let nextCalled = false;

      authenticate(req, res, (err) => {
        if (!err) nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.equal(req.user.id, 'usr-123');
      assert.equal(req.user.role, 'SUPERVISOR');
    });
  });

  describe('authorize Middleware', () => {
    it('should grant access when user has matching role', () => {
      const req = { user: { role: 'MANAJER_OPERASIONAL' } };
      const res = {};
      let nextCalled = false;

      const authMiddleware = authorize('ADMIN', 'MANAJER_OPERASIONAL');
      authMiddleware(req, res, (err) => {
        if (!err) nextCalled = true;
      });

      assert.equal(nextCalled, true);
    });

    it('should deny access (403) when user role is not permitted', () => {
      const req = { user: { role: 'SALES' } };
      const res = {};
      let caughtError = null;

      const authMiddleware = authorize('SUPERVISOR', 'MANAJER_OPERASIONAL');
      authMiddleware(req, res, (err) => {
        caughtError = err;
      });

      assert.ok(caughtError instanceof AppError);
      assert.equal(caughtError.statusCode, 403);
      assert.ok(caughtError.message.includes('tidak memiliki izin'));
    });

    it('should deny unauthenticated user (401)', () => {
      const req = {};
      const res = {};
      let caughtError = null;

      const authMiddleware = authorize('ADMIN');
      authMiddleware(req, res, (err) => {
        caughtError = err;
      });

      assert.ok(caughtError instanceof AppError);
      assert.equal(caughtError.statusCode, 401);
    });
  });
});
