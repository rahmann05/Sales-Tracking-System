/** createCluster - single-responsibility service (extracted from clusters.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateClusterCache } from './clusters.helpers.js';


export const createCluster = async (data) => {
  const { name, region, colorHex, assignedSalesId, assignedSpvId, supervisorId, centerLat, centerLng, outletCount } = data;
  const createPayload = { name, region };
  if (colorHex !== undefined) createPayload.colorHex = colorHex;
  if (centerLat !== undefined) createPayload.centerLat = centerLat;
  if (centerLng !== undefined) createPayload.centerLng = centerLng;
  if (outletCount !== undefined) createPayload.outletCount = outletCount;
  if (assignedSalesId) createPayload.assignedSalesId = assignedSalesId;
  const finalSpvId = supervisorId || assignedSpvId;
  if (finalSpvId) createPayload.supervisorId = finalSpvId;

  const result = await prisma.cluster.create({
    data: createPayload,
    include: {
      _count: { select: { outlets: true, users: true } },
      routes: true,
      assignedSales: { select: { id: true, name: true, role: true } },
      supervisor: { select: { id: true, name: true, role: true } },
      users: { select: { id: true, name: true, role: true } }
    },
  });
  if (assignedSalesId) {
    await prisma.user.update({
      where: { id: assignedSalesId },
      data: { clusterId: result.id }
    }).catch(e => console.warn('[createCluster] User cluster sync notice:', e.message));
  }
  invalidateClusterCache();
  return result;
};
