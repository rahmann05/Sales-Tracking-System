/** updateCluster - single-responsibility service (extracted from clusters.service.js). */
import { validateAssignments } from './cluster-assignment-policy.service.js';
import { AppError } from '../../../utils/errors.js';
import { prisma } from '../../../config/prisma.js';
import { invalidateClusterCache } from './clusters.helpers.js';
import {requireClusterImpact} from './cluster-impact.service.js';


export const updateCluster = async (id, data, actor) => {
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

  const result = await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
    const previous = await tx.cluster.findUnique({where:{id},select:{name:true,deletedAt:true,assignedSalesId:true,supervisorId:true}});
    if(!previous||previous.deletedAt)throw new AppError('Kluster tidak ditemukan',404);
    if(previous.name==='Belum Ditugaskan')throw new AppError('Wilayah penampung outlet tidak dapat diubah',409);
    const members=await tx.outlet.findMany({where:{clusterId:id,deletedAt:null},select:{id:true}});
    await requireClusterImpact(tx,{clusterId:id,outletIds:members.map(o=>o.id),supervisorId:updatePayload.supervisorId,assignedSalesId:updatePayload.assignedSalesId},actor,data.impactToken);
    await validateAssignments(tx,{...previous,...updatePayload},actor);
    if (assignedSalesId !== undefined && previous?.assignedSalesId !== (assignedSalesId || null)) {
      await tx.user.updateMany({where:{clusterId:id},data:{clusterId:null}});
    }
    const result = await tx.cluster.update({
    where: { id },
    data: updatePayload,
    include: {
      _count: { select: { outlets: {where:{deletedAt:null}}, users: {where:{deletedAt:null}} } },
      routes: true,
      assignedSales: { select: { id: true, name: true, role: true } },
      supervisor: { select: { id: true, name: true, role: true } },
      users: { select: { id: true, name: true, role: true } }
    },
  });
    if (assignedSalesId) await tx.user.updateMany({where:{id:assignedSalesId,clusterId:null},data:{clusterId:id}});
    return result;
  });
  invalidateClusterCache(id);
  return result;
};
