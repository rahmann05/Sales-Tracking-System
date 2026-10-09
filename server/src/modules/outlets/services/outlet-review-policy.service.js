import { outletClusterScope } from '../../../utils/team-scope.js';
import { AppError } from '../../../utils/errors.js';
export const actorSnapshot = actor => ({ id:actor?.id || 'SYSTEM', name:actor?.name || 'Sistem', role:actor?.role || 'SYSTEM' });
export const locationSnapshot = outlet => ({ name:outlet.name,address:outlet.address,latitude:outlet.latitude,longitude:outlet.longitude,clusterId:outlet.clusterId });
export const sameSnapshot = (a,b) => JSON.stringify(locationSnapshot(a)) === JSON.stringify(locationSnapshot(b));
export async function reviewScope(actor,db) {
  if (!actor) throw new AppError('Identitas pengguna diperlukan',401);
  return {deletedAt:null,cluster:await outletClusterScope(actor,db)};
}
export async function reviewOutlet(db,actor,id) {
  const outlet=await db.outlet.findFirst({where:{id,...await reviewScope(actor,db)},include:{cluster:true}});
  if (!outlet) throw new AppError('Outlet berada di luar penugasan atau sudah nonaktif',403);
  return outlet;
}
export const reviewInclude = {runs:{orderBy:{createdAt:'desc'},take:10}};
export async function lockOutlet(db,id) {
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`outlet:${id}`}))`;
}
