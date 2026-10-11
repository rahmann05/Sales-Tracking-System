import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { assertEvidenceImages } from '../../../utils/evidence-images.js';

/** Foto armada wajib; mengganti foto dicatat pada audit tanpa menyimpan isi gambar. */
export const setVehiclePhoto = async (id, photoUrl, actor = {}) => {
  await assertEvidenceImages({ photoUrl });
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`vehicle:${id}`}))`;
    const vehicle = await tx.vehicle.findUnique({ where: { id } });
    if (!vehicle || vehicle.deletedAt) throw new AppError('Kendaraan tidak ditemukan', 404);
    const photoUpdatedAt = new Date();
    const updated = await tx.vehicle.update({ where: { id }, data: { photoUrl, photoUpdatedAt } });
    await tx.auditEvent.create({ data: { actorId: actor.id || null, actorName: actor.name || null, action: 'VEHICLE_PHOTO_SET', entityType: 'VEHICLE', entityId: id, before: { hasPhoto: !!vehicle.photoUrl }, after: { hasPhoto: true, photoUpdatedAt: photoUpdatedAt.toISOString() } } });
    return updated;
  });
};
