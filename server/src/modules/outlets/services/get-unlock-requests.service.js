import { teamSalesWhere } from '../../../utils/team-scope.js';
/** getUnlockRequests - single-responsibility service (extracted from outlet-lock.service.js). */
import { prisma } from '../../../config/prisma.js';
import {Prisma} from '@prisma/client';
import {processPolicyValues} from '../../../../../shared/process-policy.mjs';


export const getUnlockRequests = async (query = {}, user = null) => {
  const { status } = query;
  const where = {};
  if (status) where.status = status;
  // Sales users may only see their own unlock requests
  if (user?.role === 'SUPERVISOR') where.requestedByUser = teamSalesWhere(user.id);
  if (user?.role === 'SALES') where.requestedBy = user.id;

  const requests=await prisma.outletUnlockRequest.findMany({
    where,
    include: {
      outlet: { select: { id: true, name: true, address: true, lockStatus: true } },
      requestedByUser: { select: { id: true, name: true, role: true } },
      handledByUser: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const limited=requests.filter(row=>Number(processPolicyValues(row.policySnapshot).UNLOCK_MAX_VISITS_PER_APPROVAL)>0);
  const counts=limited.length?await prisma.$queryRaw(Prisma.sql`
    SELECT r.id, COUNT(s.id)::int AS "usedVisits"
    FROM "OutletUnlockRequest" r
    LEFT JOIN "PjpStop" s ON s."outletId"=r."outletId"
      AND (s."visitSession"->'exceptionIds') ? r.id
      AND EXISTS (SELECT 1 FROM "Pjp" p WHERE p.id=s."pjpId" AND p."userId"=r."requestedBy")
    WHERE r.id IN (${Prisma.join(limited.map(row=>row.id))}) GROUP BY r.id
  `):[];
  const usages=new Map(counts.map(row=>[row.id,row.usedVisits]));
  return requests.map(row=>{
    const maxVisits=Number(processPolicyValues(row.policySnapshot).UNLOCK_MAX_VISITS_PER_APPROVAL)||0,usedVisits=usages.get(row.id)||0;
    return {...row,maxVisits,usedVisits,remainingVisits:maxVisits?Math.max(0,maxVisits-usedVisits):null};
  });
};
