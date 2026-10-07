import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
export async function requireActiveShift(userId, db = prisma) {
  if (!await getDynamicConfig('ATTENDANCE_REQUIRE_ACTIVE_SHIFT', false)) return;
  if (!await db.staffActivity.findFirst({ where: {userId,kind:'SHIFT',dateKey:wibDateKey(),checkOutAt:null},select:{id:true} })) throw new AppError('Mulai shift sebelum kunjungan',409);
}
export async function attendanceException(outletId,userId,db=prisma) {
  return Boolean(await db.outletUnlockRequest.findFirst({ where:{outletId,requestedBy:userId,status:'APPROVED',expiresAt:{gt:new Date()}},select:{id:true} }));
}
