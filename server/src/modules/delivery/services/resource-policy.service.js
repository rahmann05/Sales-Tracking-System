import { AppError } from '../../../utils/errors.js';
import { scheduleWindow } from '../../../../../shared/delivery-operations.mjs';
import {readReviewDefinitions,reviewIdentity} from '../../config/services/approval-readiness.service.js';

export async function assertResources(tx, candidate) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
  for (const key of [`driver:${candidate.driverId}`, `vehicle:${candidate.vehicleId}`].sort()) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  // Detect an account update committed while a serializable transaction waited for the actor lock.
  await tx.$executeRaw`SELECT "id" FROM "User" WHERE "id"=${candidate.driverId} FOR UPDATE`;
  const vehicle = await tx.vehicle.findUnique({ where: { id: candidate.vehicleId } });
  const driver = await tx.user.findUnique({ where: { id: candidate.driverId } });
  if (!vehicle || vehicle.deletedAt || !vehicle.isActive || vehicle.condition !== 'AVAILABLE') throw new AppError('Kendaraan tidak siap beroperasi', 409);
  if (!driver || driver.deletedAt || driver.role !== 'SUPIR') throw new AppError('Supir tidak aktif', 409);
  if(reviewIdentity(driver,await readReviewDefinitions(tx)).permissions.can_access_driver_map===false)throw new AppError('Driver tidak mempunyai akses tugas pengiriman. Perbaiki izin atau pilih Driver lain.',409);
  const { start, end } = scheduleWindow(candidate);
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || end <= start) throw new AppError('Jadwal akhir harus setelah jadwal berangkat', 400);
  const others = await tx.deliveryRoute.findMany({ where: { id: { not: candidate.id || '' }, closedAt: null, cancelledAt: null, OR: [{ driverId: candidate.driverId }, { vehicleId: candidate.vehicleId }] } });
  const conflict = others.find(r => {
    const window = scheduleWindow(r);
    return (!r.returnedAt && (r.departedAt || ['IN_TRANSIT','COMPLETED','PARTIAL'].includes(r.status))) || (start < window.end && end > window.start);
  });
  if (conflict) throw new AppError(`Kendaraan/supir masih digunakan pada ${conflict.code}. Atur trip tanpa bentrok atau tutup trip sebelumnya.`, 409);
  return vehicle;
}
