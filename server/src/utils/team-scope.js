import { prisma } from '../config/prisma.js';
import { AppError } from './errors.js';

export const teamSalesWhere = supervisorId => ({ supervisorId });
export const salesScope = user => user.role === 'SALES' ? { id: user.id }
  : user.role === 'SUPERVISOR' ? teamSalesWhere(user.id) : {};
export const scopeQuery = (query, user) => ({ ...query, userId: user.role === 'SALES' ? user.id : query.userId,
  supervisorId: user.role === 'SUPERVISOR' ? user.id : undefined });
export async function assertSalesAccess(user, salesId, db = prisma) {
  if (user.role === 'ADMIN' || user.id === salesId) return;
  if (user.role !== 'SUPERVISOR' || !await db.user.findFirst({ where: { id: salesId, deletedAt: null, ...teamSalesWhere(user.id) }, select: { id: true } }))
    throw new AppError('Data sales berada di luar tim Anda', 403);
}
export async function outletClusterScope(user,db=prisma) {
  if (user.role==='ADMIN') return {deletedAt:null};
  if (user.role==='SUPERVISOR') return {deletedAt:null,supervisorId:user.id};
  const sales = await db.user.findFirst({where:{id:user.id,role:'SALES',deletedAt:null},select:{supervisorId:true}});
  return {deletedAt:null,supervisorId:sales?.supervisorId || '__unassigned__',OR:[{assignedSalesId:user.id},{users:{some:{id:user.id}}}]};
}
export async function assertOutletAccess(user,outletId,db=prisma) {
  if (user.role==='ADMIN') return;
  const cluster = await outletClusterScope(user,db);
  if (!await db.outlet.findFirst({where:{id:outletId,deletedAt:null,cluster},select:{id:true}})) throw new AppError('Outlet berada di luar penugasan Anda',403);
}
