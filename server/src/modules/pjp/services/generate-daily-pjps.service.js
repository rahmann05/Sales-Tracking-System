/** generateDailyPjps - single-responsibility service (extracted from pjp.service.js). */
import { prisma } from '../../../config/prisma.js';
import { parsePagination, buildPaginatedResponse, buildDayRange } from '../../../utils/pagination.js';
import { PJP_STATUS, PJP_TYPE, ROLES } from '../../../utils/constants.js';


export const generateDailyPjps = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayRange = buildDayRange(yesterday.toISOString());

  let generatedCount = 0;

  // Step 1: Generate PJP for each active Sales user
  const salesUsers = await prisma.user.findMany({
    where: { role: ROLES.SALES, deletedAt: null, clusterId: { not: null } },
  });

  for (const sales of salesUsers) {
    const existingPjp = await prisma.pjp.findFirst({
      where: { userId: sales.id, date: { gte: today } },
    });
    if (existingPjp || !sales.clusterId) continue;

    const clusterOutlets = await prisma.outlet.findMany({
      where: { clusterId: sales.clusterId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    if (clusterOutlets.length === 0) continue;

    await prisma.pjp.create({
      data: {
        userId: sales.id,
        date: today,
        type: PJP_TYPE.SALES,
        status: PJP_STATUS.SCHEDULED,
        stops: {
          create: clusterOutlets.map((outlet, idx) => ({
            outletId: outlet.id,
            sequence: idx + 1,
            status: 'PENDING',
          })),
        },
      },
    });
    generatedCount++;
  }

  return {
    message: `PJP berhasil di-generate (${generatedCount} rute dibuat)`,
    count: generatedCount,
  };
};
