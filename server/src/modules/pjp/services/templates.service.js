import { getCurrentWeekType } from './pjp.helpers.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { workingDays } from '../../../../../shared/working-calendar.mjs';
import { z } from 'zod';
import { prisma } from '../../../config/prisma.js';
import { assertSalesAccess, assertOutletAccess, salesScope } from '../../../utils/team-scope.js';
import { AppError } from '../../../utils/errors.js';
const template = z.object({ userId: z.string().min(1), dayOfWeek: z.number().int().min(0).max(6),
  weekType: z.enum(['ALL','WEEK_1','WEEK_2']), outletIds: z.array(z.string().min(1)).max(200) });
export async function listTemplates(user) {
  const sales = await prisma.user.findMany({ where: { role: 'SALES', deletedAt: null, ...salesScope(user) },
    select: { id: true, name: true, supervisorId:true, supervisor:{select:{name:true}}, assignedClusters:{where:{deletedAt:null},select:{id:true,name:true}}, cluster: { select: { name: true, supervisor: { select: { name: true } } } }, pjpTemplates: { include: { stops: { include: { outlet: {select:{id:true,name:true}} }, orderBy: { sequence: 'asc' } } } } }, orderBy: { name: 'asc' } });
  const outlets = await prisma.outlet.findMany({ where: { deletedAt: null,cluster:{deletedAt:null,...(user.role === 'SUPERVISOR' ? {supervisorId:user.id} : user.role === 'SALES' ? {OR:[{users:{some:{id:user.id}}},{assignedSalesId:user.id}]} : {})}}, select: { id:true, name:true,outletCode:true,address:true,itineraryCode:true,latitude:true,longitude:true, clusterId:true, cluster:{select:{id:true,supervisorId:true,assignedSalesId:true,name:true}} }, orderBy: { name:'asc' } });
  const weekMode=await getDynamicConfig('PJP_WEEK_MODE','ISO_PARITY');
  const supervisors=await prisma.user.findMany({where:{role:'SUPERVISOR',deletedAt:null,...(user.role==='ADMIN'?{}:{id:user.role==='SUPERVISOR'?user.id:sales[0]?.supervisorId||'__none__'})},select:{id:true,name:true},orderBy:{name:'asc'}});
  return { sales, outlets,supervisors,weekMode, currentWeekType:getCurrentWeekType(new Date(),weekMode), workingDays: workingDays(await getDynamicConfig('PJP_WORKING_DAYS', '1,2,3,4,5,6')) };
}
export async function saveTemplates(raw, user) {
  const entries = z.array(template).min(1).max(500).parse(raw);
  const keys = entries.map(e => `${e.userId}:${e.dayOfWeek}:${e.weekType}`);
  if (new Set(keys).size !== keys.length) throw new AppError('Jadwal duplikat dalam pengajuan',400);
  return prisma.$transaction(async tx => {
    for (const e of [...entries].sort((a,b) => a.userId.localeCompare(b.userId))) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`team:${e.userId}`}))`;
      await assertSalesAccess(user, e.userId, tx);
      const sales = await tx.user.findFirst({ where: {id:e.userId,role:'SALES',deletedAt:null},select:{id:true,supervisorId:true} });
      if (!sales) throw new AppError('Sales aktif tidak ditemukan',404);
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`template:${e.userId}`}))`;
      if (new Set(e.outletIds).size !== e.outletIds.length) throw new AppError('Outlet duplikat dalam jadwal',400);
      for (const id of e.outletIds) {
        const outlet = await tx.outlet.findFirst({where:{id,deletedAt:null,cluster:{deletedAt:null}},select:{id:true,cluster:{select:{supervisorId:true}}}});
        if (!outlet) throw new AppError('Outlet aktif tidak ditemukan',404);
        await assertOutletAccess(user,id,tx);
        if (!sales.supervisorId || outlet.cluster.supervisorId !== sales.supervisorId) throw new AppError('Outlet jadwal harus berada di wilayah tim sales',400);
      }
      const record = await tx.pjpTemplate.upsert({ where: { userId_dayOfWeek_weekType: {userId:e.userId,dayOfWeek:e.dayOfWeek,weekType:e.weekType} }, create: {userId:e.userId,dayOfWeek:e.dayOfWeek,weekType:e.weekType}, update: {} });
      await tx.pjpTemplateStop.deleteMany({where:{pjpTemplateId:record.id}});
      if (e.outletIds.length) await tx.pjpTemplateStop.createMany({data:e.outletIds.map((outletId,i)=>({pjpTemplateId:record.id,outletId,sequence:i+1}))});
    }
    return { count: entries.length };
  }, {timeout:30000});
}
