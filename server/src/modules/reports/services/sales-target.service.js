import { z } from 'zod';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { targetPeriodError, targetKey } from '../../../../../shared/sales-targets.mjs';
const identity = z.object({ kind: z.enum(['MONTH','WEEK']), period: z.string(), userId: z.string().uuid() });
const definition = identity.extend({ amount: z.number().int().min(0).max(1000000000000), supervisorId: z.string().uuid().nullable(),
  revision: z.number().int().min(0), reason: z.string().trim().min(5).max(1000) }).strict();
function parse(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) throw new AppError(result.error.issues.map(issue => issue.message).join('; '), 400);
  const error = targetPeriodError(result.data.kind, result.data.period);
  if (error) throw new AppError(error,400);
  return result.data;
}
function requireAdmin(actor) {
  if (actor?.role !== 'ADMIN' || actor.permissions?.can_view_reports === false) throw new AppError('Penetapan target hanya untuk Admin yang memiliki akses laporan',403);
}
export async function getSalesTarget(input, actor) {
  requireAdmin(actor);
  const data = parse(identity,input), key = targetKey(data.kind,data.period,data.userId);
  const [saved, history] = await Promise.all([
    prisma.systemConfig.findUnique({where:{key}}),
    prisma.auditEvent.findMany({where:{entityType:'SALES_TARGET',entityId:key},orderBy:{createdAt:'desc'},take:30}),
  ]);
  return {target:saved?.value || null,history};
}
export async function saveSalesTarget(input, actor) {
  requireAdmin(actor);
  const data = parse(definition,input), key = targetKey(data.kind,data.period,data.userId);
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`sales-target:${key}`}))`;
    const saved = await tx.systemConfig.findUnique({where:{key}}), previous = saved?.value || null;
    if ((previous?.revision || 0) !== data.revision) throw new AppError('Target sudah diubah Admin lain. Muat ulang sebelum menyimpan.',409);
    const sales = await tx.user.findUnique({where:{id:data.userId},select:{id:true,name:true,role:true,deletedAt:true}});
    // Existing historical participants may have become inactive or changed role.
    if (!sales || (sales.role !== 'SALES' && !await tx.pjp.findFirst({where:{userId:data.userId},select:{id:true}})
      && !await tx.offPjpAttendance.findFirst({where:{userId:data.userId},select:{id:true}}))) throw new AppError('Sales atau peserta laporan historis tidak ditemukan',404);
    if (data.supervisorId && data.supervisorId !== previous?.supervisorId && !await tx.user.findFirst({where:{id:data.supervisorId,role:'SUPERVISOR',deletedAt:null},select:{id:true}})) throw new AppError('SPV penanggung jawab tidak aktif',400);
    const value = {...data,salesName:sales.name,revision:data.revision+1,updatedAt:new Date().toISOString(),updatedBy:actor.id,updatedByName:actor.name || null};
    await tx.systemConfig.upsert({where:{key},create:{key,value},update:{value}});
    await tx.auditEvent.create({data:{actorId:actor.id,actorName:actor.name || null,entityType:'SALES_TARGET',entityId:key,action:previous?'REVISE_TARGET':'SET_TARGET',before:previous || {},after:value}});
    return value;
  });
}
export async function loadSalesTargets(userIds,kind,period) {
  if (!userIds.length || targetPeriodError(kind,period)) return new Map();
  const keys = userIds.map(id => targetKey(kind,period,id));
  const rows = await prisma.systemConfig.findMany({where:{key:{in:keys}},select:{key:true,value:true}});
  return new Map(rows.filter(row=>keys.includes(row.key) && row.value?.revision && Number.isSafeInteger(row.value.amount))
    .map(row=>[row.value.userId,row.value]));
}
