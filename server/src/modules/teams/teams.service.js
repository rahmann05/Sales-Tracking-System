import {policyNotification} from '../notifications/services/notification-policy.service.js';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { getDynamicConfig } from '../config/config.service.js';
import { invalidateClusterCache } from '../clusters/services/clusters.helpers.js';
const selection = {id:true,name:true,email:true,supervisorId:true,updatedAt:true,cluster:{select:{id:true,name:true,deletedAt:true}},supervisor:{select:{id:true,name:true}},assignedClusters:{where:{deletedAt:null},select:{id:true,name:true}}};
export async function listTeams(actor) {
  const canClaim = await getDynamicConfig('TEAM_SPV_CAN_CLAIM_UNASSIGNED',true);
  const [sales,supervisors] = await Promise.all([
    prisma.user.findMany({where:{role:'SALES',deletedAt:null,...(actor.role==='SUPERVISOR'?{OR:[{supervisorId:actor.id},...(canClaim?[{supervisorId:null}]:[])]}:{})},select:selection,orderBy:{name:'asc'}}),
    prisma.user.findMany({where:{role:'SUPERVISOR',deletedAt:null,...(actor.role==='SUPERVISOR'?{id:actor.id}:{})},select:{id:true,name:true},orderBy:{name:'asc'}})
  ]);
  return {sales:sales.map(({cluster,...member})=>({...member,assignedClusters:[...member.assignedClusters,...(cluster&&!cluster.deletedAt&&!member.assignedClusters.some(c=>c.id===cluster.id)?[{id:cluster.id,name:cluster.name}]:[])]})),supervisors,canClaim};
}
export async function assignTeam(salesId, raw, actor) {
  const body = z.object({supervisorId:z.string().min(1).nullable(),updatedAt:z.string().datetime(),reason:z.string().trim().min(5).max(500)}).parse(raw);
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPERVISOR') throw new AppError('Tidak berwenang mengatur tim',403);
  const canClaim = await getDynamicConfig('TEAM_SPV_CAN_CLAIM_UNASSIGNED',true);
  const result = await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`team:${salesId}`}))`;
    const sales = await tx.user.findFirst({where:{id:salesId,role:'SALES',deletedAt:null},select:{id:true,supervisorId:true,updatedAt:true}});
    if (!sales) throw new AppError('Sales aktif tidak ditemukan',404);
    if (sales.updatedAt.toISOString() !== body.updatedAt) throw new AppError('Penugasan telah berubah. Muat ulang daftar tim.',409);
    if (actor.role==='SUPERVISOR' && (!canClaim || sales.supervisorId || body.supervisorId !== actor.id)) throw new AppError('Transfer dan pelepasan tim hanya dapat dilakukan admin',403);
    if (body.supervisorId && !await tx.user.findFirst({where:{id:body.supervisorId,role:'SUPERVISOR',deletedAt:null},select:{id:true}})) throw new AppError('Supervisor aktif tidak ditemukan',400);
    if (sales.supervisorId === body.supervisorId) return {changed:false};
    // Existing PJP and attendance remain immutable. Only future assignments are reset.
    const territories = await tx.cluster.findMany({where:{assignedSalesId:salesId},select:{id:true,supervisorId:true}});
    const released = territories.filter(c=>c.supervisorId !== body.supervisorId || !body.supervisorId).map(c=>c.id);
    if (released.length) await tx.cluster.updateMany({where:{id:{in:released}},data:{assignedSalesId:null}});
    await tx.pjpTemplate.deleteMany({where:{userId:salesId}});
    await tx.user.update({where:{id:salesId},data:{supervisorId:body.supervisorId,clusterId:null}});
    await policyNotification(tx,{data:{userId:salesId,title:'Penugasan tim diperbarui',message:`${body.reason}. Jadwal mendatang perlu ditetapkan kembali; PJP yang sudah terbentuk tetap.`,type:'TEAM_ASSIGNMENT',payload:{previousSupervisorId:sales.supervisorId,supervisorId:body.supervisorId,actorId:actor.id,reason:body.reason,releasedClusterIds:released}}});
    return {changed:true,releasedClusterIds:released};
  });
  invalidateClusterCache();
  return result;
}
