import {teamSalesWhere} from '../../../utils/team-scope.js';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { parsePagination } from '../../../utils/pagination.js';
const assertReviewer = user => { if (!['ADMIN','SUPERVISOR'].includes(user.role)) throw new AppError('Khusus admin atau supervisor', 403); };
const teamScope = user => user.role === 'ADMIN' ? {} : { user: teamSalesWhere(user.id) };
export async function listManualSales(user, query = {}) {
  assertReviewer(user);
  const { skip, take, page, limit } = parsePagination(query);
  const kind = query.kind === 'OFF_PJP' ? 'OFF_PJP' : 'PJP';
  const model = kind === 'PJP' ? prisma.attendance : prisma.offPjpAttendance;
  const status = ['PENDING','APPROVED','REJECTED'].includes(query.status) ? query.status : 'PENDING';
  const where = { ...teamScope(user), manualSalesMode: 'REQUIRE_APPROVAL', manualSalesStatus: status, ...(kind === 'PJP' ? { type: 'OUT', pjpStop: { orders: { none: { deletedAt: null } } } } : { status: 'APPROVED' }) };
  const include = { user: { select: { id: true, name: true } }, ...(kind === 'PJP' ? { pjpStop: { include: { outlet: true } } } : {}) };
  const [data,total] = await Promise.all([model.findMany({ where, include, skip, take, orderBy: { createdAt: 'desc' } }), model.count({ where })]);
  return { data, total, page, limit, kind };
}
export async function reviewManualSales(user, kind, id, decision, note) {
  assertReviewer(user);
  if (!['PJP','OFF_PJP'].includes(kind) || !['APPROVED','REJECTED'].includes(decision)) throw new AppError('Keputusan tidak valid', 400);
  if (decision === 'REJECTED' && !note?.trim()) throw new AppError('Alasan penolakan wajib diisi', 400);
  return prisma.$transaction(async tx => {
    const model = kind === 'PJP' ? tx.attendance : tx.offPjpAttendance;
    const record = await model.findFirst({ where: { id, ...teamScope(user) }, include: kind === 'PJP' ? { pjpStop: { include: { orders: true } } } : undefined });
    if (!record) throw new AppError('Pengajuan tidak ditemukan dalam lingkup Anda', 404);
    if (record.userId === user.id) throw new AppError('Tidak dapat menyetujui hasil sendiri', 403);
    if (record.manualSalesMode !== 'REQUIRE_APPROVAL' || record.manualSalesStatus !== 'PENDING') throw new AppError('Pengajuan bukan pending atau hanya catatan', 409);
    if (kind === 'PJP' && (record.type !== 'OUT' || record.pjpStop.orders.some(o => !o.deletedAt))) throw new AppError('Sudah terdapat order terperinci. Gunakan approval order.', 409);
    if (kind === 'OFF_PJP' && record.status !== 'APPROVED') throw new AppError('Validasi kunjungan luar PJP terlebih dahulu', 409);
    const changed = await model.updateMany({ where: { id, manualSalesStatus: 'PENDING' }, data: { manualSalesStatus: decision, isManualSalesApproved: decision === 'APPROVED', manualSalesReviewedBy: user.id, manualSalesReviewedAt: new Date(), manualSalesReviewNote: note?.trim() || null } });
    if (!changed.count) throw new AppError('Pengajuan sudah diproses', 409);
    return model.findUnique({ where: { id } });
  }, { isolationLevel: 'Serializable' });
}
