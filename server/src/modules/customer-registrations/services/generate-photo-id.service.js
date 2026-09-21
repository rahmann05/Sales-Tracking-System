/** generatePhotoId - single-responsibility service (extracted from customer-photo.service.js). */
import crypto from 'crypto';

/**
 * Generate unique photo ID matching registration data
 * Format: PHOTO-YYYYMMDD-HEX6 (e.g. PHOTO-20260824-A9F321)
 */
export const generatePhotoId = (prefix = 'PHOTO') => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `${prefix}-${year}${month}${day}-${randomHex}`;
};
