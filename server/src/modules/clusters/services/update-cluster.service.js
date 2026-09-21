/** updateCluster - single-responsibility service (extracted from clusters.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateClusterCache } from './clusters.helpers.js';


export const updateCluster = async (id, data) => {
  const { name, region, colorHex, centerLat, centerLng, outletCount, assignedSalesId, assignedSpvId, supervisorId } = data;
  const updatePayload = {};
  if (name !== undefined) updatePayload.name = name;
  if (region !== undefined) updatePayload.region = region;
  if (colorHex !== undefined) updatePayload.colorHex = colorHex;
  if (centerLat !== undefined) updatePayload.centerLat = centerLat;
  if (centerLng !== undefined) updatePayload.centerLng = centerLng;
  if (outletCount !== undefined) updatePayload.outletCount = outletCount;
  if (assignedSalesId !== undefined) updatePayload.assignedSalesId = assignedSalesId || null;
  const finalSpvId = supervisorId !== undefined ? supervisorId : assignedSpvId;
  if (finalSpvId !== undefined) updatePayload.supervisorId = finalSpvId || null;

  if (assignedSalesId) {
    await prisma.user.update({
      where: { id: assignedSalesId },
      data: { clusterId: id }
    }).catch(e => console.warn('[updateCluster] User cluster sync notice:', e.message));
  }

  const result = await prisma.cluster.update({
    where: { id },
    data: updatePayload,
    include: {
      _count: { select: { outlets: true, users: true } },
      routes: true,
      assignedSales: { select: { id: true, name: true, role: true } },
      supervisor: { select: { id: true, name: true, role: true } },
      users: { select: { id: true, name: true, role: true } }
    },
  });
  invalidateClusterCache(id);
  return result;
};
