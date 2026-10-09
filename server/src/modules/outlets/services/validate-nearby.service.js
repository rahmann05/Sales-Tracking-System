import { AppError } from '../../../utils/errors.js';
export async function validateNearby() {
  throw new AppError('Gunakan pemeriksaan lokasi melalui kasus pemeriksaan agar seluruh bukti dan waktunya konsisten.',410);
}
