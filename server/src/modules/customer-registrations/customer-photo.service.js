import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'outlet-photos');

// Ensure storage bucket directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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

/**
 * Save base64 photo to uploads/outlet-photos/ folder and generate dedicated photoId
 */
export const saveOutletPhoto = async (photoBase64, prefix = 'PHOTO') => {
  if (!photoBase64 || typeof photoBase64 !== 'string') {
    return { photoId: null, photoUrl: null };
  }

  // If it's already an existing relative URL, keep it
  if (photoBase64.startsWith('/uploads/')) {
    return {
      photoId: generatePhotoId(prefix),
      photoUrl: photoBase64,
    };
  }

  try {
    const photoId = generatePhotoId(prefix);
    const filename = `${photoId}.jpg`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Extract base64 payload
    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    await fs.promises.writeFile(filepath, buffer);

    const photoUrl = `/uploads/outlet-photos/${filename}`;
    console.log(`[PhotoStorage] Saved outlet photo: ${photoId} -> ${photoUrl} (${buffer.length} bytes)`);

    return {
      photoId,
      photoUrl,
      filename,
      size: buffer.length,
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[PhotoStorage] Failed to save photo to bucket:', err);
    return { photoId: null, photoUrl: null };
  }
};
