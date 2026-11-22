import { prisma } from '../../../server/src/config/prisma.js';
import { wibDayRange } from '../../../shared/visit-metrics.mjs';
import { effectivePolicy } from '../../../server/src/modules/config/services/policy-resolver.service.js';
import { withPolicy } from '../../../server/src/modules/config/services/policy-context.service.js';
import {
  ensureTodayPjpForSales,
  generateTodayPjpsAllSales,
} from '../../../server/src/modules/pjp/services/pjp.helpers.js';
import { AppError } from '../../../server/src/utils/errors.js';

/**
 * Generates or safely rebuilds today's Sales PJP from the latest cluster assignment.
 * Guardrail: refuses rebuild when today's PJP already has visit, order, or non-PENDING stop activity.
 */
export async function syncDemoTodayPjp(
  { salesId = null, rebuild = false } = {},
  {
    db = prisma,
    ensureSales = ensureTodayPjpForSales,
    generateAll = generateTodayPjpsAllSales,
    policyFor = effectivePolicy,
  } = {}
) {
  if (!salesId) {
    const count = await generateAll();
    return { synced: true, createdCount: count };
  }

  const sales = await db.user.findFirst({
    where: { id: salesId, role: 'SALES', deletedAt: null },
    select: { id: true, name: true, role: true, supervisorId: true, clusterId: true },
  });
  if (!sales) {
    throw new AppError('Akun Sales aktif tidak ditemukan', 404);
  }

  const todayPjp = await db.pjp.findFirst({
    where: { userId: sales.id, type: 'SALES', date: wibDayRange() },
    include: {
      stops: {
        select: {
          id: true,
          status: true,
          attendances: { select: { id: true }, take: 1 },
          orders: { where: { deletedAt: null }, select: { id: true }, take: 1 },
        },
      },
    },
  });

  if (todayPjp && rebuild) {
    const hasProgress = (todayPjp.stops || []).some(
      (stop) =>
        stop.status !== 'PENDING' ||
        (stop.attendances && stop.attendances.length > 0) ||
        (stop.orders && stop.orders.length > 0)
    );
    if (hasProgress) {
      throw new AppError(
        'PJP hari ini sudah memiliki aktivitas absensi/order/status dan dilindungi guardrail demo.',
        409
      );
    }
    const removePjp = async (tx) => {
      await tx.pjpStop.deleteMany({ where: { pjpId: todayPjp.id } });
      await tx.pjp.delete({ where: { id: todayPjp.id } });
    };
    if (typeof db.$transaction === 'function') {
      await db.$transaction(removePjp);
    } else {
      await removePjp(db);
    }
  }

  const syncedPjp = await withPolicy(await policyFor(sales), () => ensureSales(sales.id));
  return {
    synced: Boolean(syncedPjp),
    salesId: sales.id,
    salesName: sales.name,
    pjpId: syncedPjp?.id || null,
    stopCount: syncedPjp?.stops?.length || 0,
  };
}
