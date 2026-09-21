/** getUnlockRequests - single-responsibility service (extracted from outlet-lock.service.js). */
import { prisma } from '../../../config/prisma.js';


export const getUnlockRequests = async (query = {}, user = null) => {
  const { status } = query;
  const where = {};
  if (status) where.status = status;
  // Sales users may only see their own unlock requests
  if (user?.role === 'SALES') where.requestedBy = user.id;

  return await prisma.outletUnlockRequest.findMany({
    where,
    include: {
      outlet: { select: { id: true, name: true, address: true, lockStatus: true } },
      requestedByUser: { select: { id: true, name: true, role: true } },
      handledByUser: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};
