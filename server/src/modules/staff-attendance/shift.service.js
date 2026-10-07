import {withUserTransaction} from '../../utils/user-transaction.js';
import { AppError } from '../../utils/errors.js';
import { getDynamicConfig } from '../config/config.service.js';
import { wibDateKey } from "../../../../shared/visit-metrics.mjs";

async function perform(db,userId, action) {
  const dateKey = wibDateKey();
  const where = { userId_dateKey_activityKey: { userId, dateKey, activityKey: 'SHIFT' } };
  const existing = action==='SHIFT_OUT'?await db.staffActivity.findFirst({where:{userId,kind:'SHIFT',checkOutAt:null},orderBy:{checkInAt:'desc'}}):await db.staffActivity.findUnique({ where });
  if (action === 'SHIFT_IN') {
    if(await db.staffActivity.findFirst({where:{userId,kind:'SHIFT',checkOutAt:null},select:{id:true}}))throw new AppError('Selesaikan shift aktif sebelumnya terlebih dahulu',409);
    if (existing) throw new AppError('Shift hari ini sudah tercatat', 409);
    const start = await getDynamicConfig('SHIFT_START_TIME', '08:00');
    const lateMinutes = Math.max(0, Math.floor((Date.now() - new Date(`${dateKey}T${start}:00+07:00`).getTime()) / 60000));
    return db.staffActivity.create({ data: { userId, dateKey, activityKey: 'SHIFT', kind: 'SHIFT', lateMinutes } });
  }
  if (!existing || existing.checkOutAt) throw new AppError('Tidak ada shift aktif', 409);
  const activeSales = await db.attendance.findFirst({ where: { userId, type: 'IN', pjpStop: { attendances: { none: { userId, type: 'OUT' } }, status: 'PENDING' } } });
  const activeVisit = await db.staffActivity.findFirst({ where: { userId, kind: 'VISIT', checkOutAt: null } });
  if (activeSales || activeVisit) throw new AppError('Selesaikan kunjungan aktif sebelum mengakhiri shift', 409);
  const updated = await db.staffActivity.updateMany({ where: { id: existing.id, checkOutAt: null }, data: { checkOutAt: new Date() } });
  if (!updated.count) throw new AppError('Shift sudah diakhiri', 409);
  return db.staffActivity.findUnique({where:{id:existing.id}});
}

export const recordShift=(userId,action)=>withUserTransaction(userId,db=>perform(db,userId,action));
