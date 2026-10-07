import {assertSingleTrade} from './cluster-trade-policy.service.js';
import { AppError } from '../../../utils/errors.js';
import { assertSalesAccess } from '../../../utils/team-scope.js';

export async function validateAssignments(db, data, actor) {
  if (data.assignedSalesId) {
    await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`team:${data.assignedSalesId}`}))`;
    const sales = await db.user.findFirst({ where: {id:data.assignedSalesId,role:'SALES',deletedAt:null},select:{id:true,supervisorId:true} });
    if (!sales) throw new AppError('Sales aktif tidak ditemukan',400);
    if (actor) await assertSalesAccess(actor,sales.id,db);
    const owner = data.supervisorId ?? data.assignedSpvId;
    if (!owner || sales.supervisorId !== owner) throw new AppError('Tetapkan sales ke tim supervisor ini sebelum menugaskan wilayah',400);
  }
  const spvId = data.supervisorId ?? data.assignedSpvId;
  if (spvId && !await db.user.findFirst({where:{id:spvId,role:'SUPERVISOR',deletedAt:null},select:{id:true}})) throw new AppError('Supervisor aktif tidak ditemukan',400);
}
export async function validateOutletAssignments(db, ids, actor) {
  if (!Array.isArray(ids) || new Set(ids).size !== ids.length) throw new AppError('Daftar outlet tidak valid atau duplikat',400);
  const outlets = await db.outlet.findMany({where:{id:{in:ids},deletedAt:null},include:{cluster:{select:{supervisorId:true,name:true}}}});
  if (outlets.length !== ids.length) throw new AppError('Outlet aktif tidak ditemukan',400);
  if (actor?.role === 'SUPERVISOR' && outlets.some(o => o.cluster?.supervisorId !== actor.id && o.cluster?.name !== 'Belum Ditugaskan')) throw new AppError('Outlet berada di luar wilayah tim',403);
  assertSingleTrade(outlets);
  return outlets;
}
export function routeRecords(clusterId, routes = [], allowedIds) {
  if (routes.filter(r=>r.isActive).length > 1 || new Set(routes.map((r,i)=>r.routeIndex ?? i)).size !== routes.length) throw new AppError('Indeks rute atau rute aktif duplikat',400);
  return routes.map((r,i)=>{
    if (!Array.isArray(r.outletOrder)) throw new AppError('Urutan outlet harus berupa daftar',400);
    const ids = r.outletOrder.map(o=>typeof o === 'string' ? o : o.id);
    if (new Set(ids).size !== ids.length || ids.some(id=>!allowedIds.has(id)) || (r.startOutletId && !ids.includes(r.startOutletId))) throw new AppError('Outlet rute harus anggota klaster tanpa duplikat',400);
    if (!Number.isFinite(Number(r.totalDistanceKm ?? 0)) || Number(r.totalDistanceKm ?? 0)<0) throw new AppError('Jarak rute tidak valid',400);
    return {clusterId,routeIndex:r.routeIndex ?? i,isActive:Boolean(r.isActive),totalDistanceKm:Number(r.totalDistanceKm ?? 0),outletOrder:ids.map((id,index)=>({id,sequence:index+1})),overviewPath:r.overviewPath ?? null,startOutletId:r.startOutletId || null};
  });
}
export async function synchronizeOutletCounts(db, clusterIds) {
  for (const id of new Set(clusterIds.filter(Boolean))) {
    const outletCount = await db.outlet.count({where:{clusterId:id,deletedAt:null}});
    await db.cluster.update({where:{id},data:{outletCount}});
  }
}
