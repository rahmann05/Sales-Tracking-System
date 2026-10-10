import {assertEvidenceImages} from '../../../utils/evidence-images.js';
/** saveOutletPhoto - single-responsibility service (extracted from customer-photo.service.js). */
import { generatePhotoId } from './generate-photo-id.service.js';

/**
 * Process and prepare photo to be stored directly in PostgreSQL database (Base64 Data URL)
 * Completely eliminates filesystem disk usage (no uploads/ folder dependency).
 */
export const saveOutletPhoto = async (photoBase64, prefix = 'PHOTO', policy = {}) => {
  if (!photoBase64 || typeof photoBase64 !== 'string') {
    return { photoId: null, photoUrl: null };
  }

  const photoId = generatePhotoId(prefix);

  // If already standard Data URL (data:image/...) or regular URL, store directly in database
  let formattedDataUrl = photoBase64;
  if (!photoBase64.startsWith('data:') && !photoBase64.startsWith('http')) {
    formattedDataUrl = `data:image/jpeg;base64,${photoBase64}`;
  }

  await assertEvidenceImages({photoUrl:formattedDataUrl},policy);

  return {
    photoId,
    photoUrl: formattedDataUrl,
    createdAt: new Date().toISOString(),
  };
};
