import { assertEvidenceImages } from '../../../utils/evidence-images.js';
import {
  isInternalEvidenceUrl,
  maybePersistEvidenceImage,
} from '../../../utils/evidence-storage.js';
/** saveOutletPhoto - single-responsibility service (extracted from customer-photo.service.js). */
import { generatePhotoId } from './generate-photo-id.service.js';

/**
 * Process and prepare outlet photo evidence (inline Base64 by default or disk-backed when EVIDENCE_STORAGE_MODE=DISK).
 */
export const saveOutletPhoto = async (photoBase64, prefix = 'PHOTO', policy = {}) => {
  if (!photoBase64 || typeof photoBase64 !== 'string') {
    return { photoId: null, photoUrl: null };
  }

  const photoId = generatePhotoId(prefix);
  if (isInternalEvidenceUrl(photoBase64)) {
    return {
      photoId,
      photoUrl: photoBase64,
      createdAt: new Date().toISOString(),
    };
  }

  // If already standard Data URL (data:image/...) or regular URL, store directly in database
  let formattedDataUrl = photoBase64;
  if (!photoBase64.startsWith('data:') && !photoBase64.startsWith('http')) {
    formattedDataUrl = `data:image/jpeg;base64,${photoBase64}`;
  }

  await assertEvidenceImages({ photoUrl: formattedDataUrl }, policy);

  const persistedUrl = await maybePersistEvidenceImage(formattedDataUrl, 'noo', {
    policyValues: policy?.values || policy,
  });

  return {
    photoId,
    photoUrl: persistedUrl,
    createdAt: new Date().toISOString(),
  };
};
