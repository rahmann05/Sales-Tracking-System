import fs from 'node:fs/promises';
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { AppError } from '../utils/errors.js';
import { defaultEvidenceRoot, resolveStoredEvidenceFile } from '../utils/evidence-storage.js';

export const createEvidenceHandler =
  (rootDir = defaultEvidenceRoot()) =>
  async (req, res, next) => {
    try {
      const resolved = resolveStoredEvidenceFile(
        req.params.domain,
        req.params.ym,
        req.params.filename,
        rootDir
      );
      if (!resolved) {
        return next(new AppError('Parameter berkas bukti tidak valid', 400));
      }
      const stat = await fs.stat(resolved.filePath).catch(() => null);
      if (!stat || !stat.isFile()) {
        return next(new AppError('Berkas bukti tidak ditemukan', 404));
      }
      res.setHeader('Content-Type', resolved.contentType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, max-age=86400');
      return res.sendFile(resolved.filePath);
    } catch (error) {
      return next(error);
    }
  };

const router = Router();

router.get('/:domain/:ym/:filename', authenticate, createEvidenceHandler());

export default router;
