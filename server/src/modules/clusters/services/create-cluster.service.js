/** createCluster - single-responsibility service (extracted from clusters.service.js). */
import { validateAssignments } from './cluster-assignment-policy.service.js';
import { prisma } from '../../../config/prisma.js';
import { invalidateClusterCache } from './clusters.helpers.js';
import { resolveBusinessCode } from '../../config/services/business-code.service.js';


export const createCluster = async (data, actor) => {
  const { name, region, colorHex, assignedSalesId, assignedSpvId, supervisorId, centerLat, centerLng, outletCount } = data;
  const createPayload = { name, region };
  if (colorHex !== undefined) createPayload.colorHex = colorHex;
  if (centerLat !== undefined) createPayload.centerLat = centerLat;
  if (centerLng !== undefined) createPayload.centerLng = centerLng;
  if (outletCount !== undefined) createPayload.outletCount = outletCount;
  if (assignedSalesId) createPayload.assignedSalesId = assignedSalesId;
  const finalSpvId = supervisorId || assignedSpvId;
  if (finalSpvId) createPayload.supervisorId = finalSpvId;

  const result = await prisma.$transaction(async tx => {
    await validateAssignments(tx,data,actor);
    createPayload.code = await resolveBusinessCode('CLUSTER',data.code,{db:tx});
    const result = await tx.cluster.create({
    data: createPayload,
    include: {
      _count: { select: { outlets: {where:{deletedAt:null}}, users: {where:{deletedAt:null}} } },
      routes: true,
      assignedSales: { select: { id: true, name: true, role: true } },
      supervisor: { select: { id: true, name: true, role: true } },
      users: { select: { id: true, name: true, role: true } }
    },
  });
    if (assignedSalesId) await tx.user.update({where:{id:assignedSalesId},data:{clusterId:result.id}});
    return result;
  });
  invalidateClusterCache();
  return result;
};
