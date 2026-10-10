import {assertEvidenceImages} from '../../../utils/evidence-images.js';
import {assertVisitReviewersAvailable} from './visit-review-permissions.js';
import {freshDomainActor} from '../../../middlewares/domain-permission.middleware.js';
import {gpsEvidence} from '../../../utils/gps-evidence.js';
import {validateVisitResult} from './visit-session.service.js';
import {capturePolicySnapshot} from '../../config/services/process-policy.service.js';
import {createCollectionFollowUp} from './collection-follow-up.service.js';
import { createHash } from 'node:crypto';
import { resolveSalesResult } from './resolve-sales-result.service.js';
import {visitOutcomeSchema} from '../visit-outcome.schema.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { AppError } from '../../../utils/errors.js';
/** createOffPjpAttendance - single-responsibility service (extracted from off-pjp.service.js). */
import { prisma } from '../../../config/prisma.js';
import { OFF_PJP_STATUS, ROLES, NOTIFICATION_TYPES } from '../../../utils/constants.js';
import { createBulkNotificationByRoles } from "../../notifications/notifications.service.js";
import { captureReportAssignment, REPORT_USER_SELECT } from '../../reports/services/report-assignment.service.js';
import {assertOutletAccess} from '../../../utils/team-scope.js';

/**
 * Sales submits an off-PJP attendance.
 */
export const createOffPjpAttendance = async (userId, data) => {
  data={...data};
  if (data.requestId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.requestId)) throw new AppError('Identitas pengiriman tidak valid', 400);
  const { outletName, customerName, phone, address, reason, latitude, longitude, photoUrl, outletId } = data;

  const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])) : value;
  const { requestId, ...content } = data;
  const fingerprint = createHash('sha256').update(JSON.stringify(canonical(content))).digest('hex');
  const requestKey = requestId ? `_OFF_PJP_REQUEST:${userId}:${requestId.toLowerCase()}` : null;
  const record = await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`staff:${userId}`}))`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`team:${userId}`}))`;
    const sales = await tx.user.findUnique({ where: { id: userId }, select: { ...REPORT_USER_SELECT, deletedAt: true } });
    if (!sales || sales.deletedAt || sales.role !== 'SALES') throw new AppError('Akun sales aktif tidak ditemukan', 403);
    if (requestKey) {
      const saved = await tx.systemConfig.findUnique({ where: { key: requestKey } });
      if (saved) {
        if (saved.value.fingerprint !== fingerprint) throw new AppError('Identitas pengiriman sudah dipakai untuk isi kunjungan berbeda. Periksa pengajuan sebelumnya.', 409);
        const existing = await tx.offPjpAttendance.findUnique({ where: { id: saved.value.recordId }, include: { user: { select: { id: true, name: true } }, outlet: { select: { id: true, name: true } } } });
        if (!existing || existing.userId !== userId) throw new AppError('Pengajuan sebelumnya tidak tersedia. Periksa riwayat sebelum membuat pengajuan baru.', 409);
        return existing;
      }
    }
    await freshDomainActor(tx,userId,'OFF_PJP');
    if(await getDynamicConfig('FEATURE_OFF_PJP_MODE','ACTIVE')!=='ACTIVE')throw new AppError('Kunjungan luar PJP baru dijeda oleh Admin',409);
    if (!await getDynamicConfig('OFF_PJP_ENABLED', true)) throw new AppError('Kunjungan luar PJP dinonaktifkan admin', 403);
    const scope=await getDynamicConfig('OFF_PJP_OUTLET_SCOPE','BOTH');
    if(scope==='MASTER_ONLY'&&!outletId||scope==='PROSPECT_ONLY'&&outletId)throw new AppError('Jenis outlet tidak diizinkan untuk kunjungan luar PJP saat ini.',422);
    let master;
    if(outletId){await assertOutletAccess(sales,outletId,tx);master=await tx.outlet.findFirst({where:{id:outletId,deletedAt:null},select:{id:true,name:true,address:true}});if(!master)throw new AppError('Outlet master tidak aktif atau tidak ditemukan.',404);}
    const limit=await getDynamicConfig('OFF_PJP_MAX_PER_WINDOW',0),days=await getDynamicConfig('OFF_PJP_WINDOW_DAYS',7),gap=await getDynamicConfig('OFF_PJP_MASTER_MIN_DAYS',0);
    if(limit>0&&await tx.offPjpAttendance.count({where:{userId,createdAt:{gte:new Date(Date.now()-days*86400000)}}})>=limit)throw new AppError(`Batas ${limit} kunjungan luar PJP dalam ${days} hari tercapai.`,409);
    if(outletId&&gap>0&&await tx.offPjpAttendance.findFirst({where:{userId,outletId,createdAt:{gte:new Date(Date.now()-gap*86400000)}},select:{id:true}}))throw new AppError(`Kunjungan luar PJP ke outlet ini harus berjarak minimal ${gap} hari.`,409);
    if(await getDynamicConfig('OFF_PJP_REQUIRE_PHOTO',true)&&!photoUrl)throw new AppError('Foto luar PJP wajib diisi',422);
    if(await getDynamicConfig('OFF_PJP_REQUIRE_GPS',true)&&(!Number.isFinite(latitude)||!Number.isFinite(longitude)))throw new AppError('GPS luar PJP wajib diisi',422);
    await assertEvidenceImages({photoUrl});
    await validateVisitResult(data);
    const needsReview=await getDynamicConfig('OFF_PJP_REQUIRE_REVIEW',true);
    const salesResult = await resolveSalesResult(data);
    await assertVisitReviewersAvailable(tx,userId,[...(needsReview?['OFF_PJP']:[]),...(salesResult.manualSalesStatus==='PENDING'?['MANUAL_SALES']:[])]);
    const record = await tx.offPjpAttendance.create({
    data: {
      ...captureReportAssignment(sales, 'OFF_PJP_SUBMISSION'),
      userId,gpsEvidence:await gpsEvidence(data),policySnapshot:await capturePolicySnapshot(),
      ...salesResult,
      ...(data.visitOutcome?{visitOutcome:visitOutcomeSchema.parse(data.visitOutcome)}:{}),
      outletId: outletId || null,
      outletName:master?.name||outletName,
      customerName: customerName || null,
      phone: phone || null,
      address:master?.address||address,
      reason,
      latitude:latitude??null,
      longitude:longitude??null,
      photoUrl: photoUrl || null,
      status: needsReview?OFF_PJP_STATUS.PENDING:OFF_PJP_STATUS.APPROVED,
    },
    include: {
      user: { select: { id: true, name: true } },
      outlet: { select: { id: true, name: true } },
    },
    });

  if(!needsReview)await createCollectionFollowUp(tx,{...record,outletName},'OFF_PJP');
  if(needsReview)await createBulkNotificationByRoles(
    [ROLES.SUPERVISOR],
    NOTIFICATION_TYPES.OFF_PJP_SUBMITTED,
    'Absen Toko Luar RJP (Menunggu Validasi)',
    `Sales ${record.user.name} melakukan absen di toko luar RJP: ${outletName}. Membutuhkan validasi Supervisor.`,
    { offPjpAttendanceId: record.id }, tx
  );

  if (requestKey) await tx.systemConfig.create({ data: { key: requestKey, value: { fingerprint, recordId: record.id } } });
  return record;
  }, { timeout: 15000 });
  return record;
};
