import { z } from 'zod';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { calendarKey, validMonth, validCalendarDate } from '../../../../../shared/report-calendar.mjs';
const schema=z.object({month:z.string(),weekdays:z.array(z.number().int().min(0).max(6)).max(7),
  exceptions:z.array(z.object({date:z.string(),working:z.boolean()}).strict()).max(31),
  revision:z.number().int().min(0),reason:z.string().trim().min(5).max(1000)}).strict();
function adminOnly(actor){if(actor?.role!=='ADMIN'||actor.permissions?.can_view_reports===false)throw new AppError('Kalender laporan hanya dapat ditetapkan Admin dengan akses laporan',403);}
function assertMonth(month){if(!validMonth(month))throw new AppError('Bulan kalender harus YYYY-MM',400);}
export async function getReportCalendar({month},actor){
  adminOnly(actor);assertMonth(month);const key=calendarKey(month);
  const [saved,history]=await Promise.all([prisma.systemConfig.findUnique({where:{key}}),prisma.auditEvent.findMany({where:{entityType:'REPORT_CALENDAR',entityId:key},orderBy:[{createdAt:'desc'},{id:'desc'}],take:30})]);
  return {calendar:saved?.value||null,history};
}
export async function saveReportCalendar(raw,actor){
  adminOnly(actor);const parsed=schema.safeParse(raw);
  if(!parsed.success)throw new AppError(parsed.error.issues.map(row=>row.message).join('; '),400);
  const data=parsed.data;assertMonth(data.month);
  if(new Set(data.weekdays).size!==data.weekdays.length||new Set(data.exceptions.map(row=>row.date)).size!==data.exceptions.length||data.exceptions.some(row=>!validCalendarDate(row.date,data.month)))throw new AppError('Hari/tanggal duplikat atau tanggal pengecualian di luar bulan kalender',400);
  const key=calendarKey(data.month);
  return prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`report-calendar:${key}`}))`;
    const previous=(await tx.systemConfig.findUnique({where:{key}}))?.value||null;
    if((previous?.revision||0)!==data.revision)throw new AppError('Kalender telah diubah Admin lain. Muat ulang sebelum menyimpan.',409);
    const value={...data,weekdays:[...data.weekdays].sort((a,b)=>a-b),exceptions:[...data.exceptions].sort((a,b)=>a.date.localeCompare(b.date)),
      revision:data.revision+1,updatedAt:new Date().toISOString(),updatedBy:actor.id,updatedByName:actor.name||null};
    await tx.systemConfig.upsert({where:{key},create:{key,value},update:{value}});
    await tx.auditEvent.create({data:{entityType:'REPORT_CALENDAR',entityId:key,action:previous?'REVISE_CALENDAR':'SET_CALENDAR',actorId:actor.id,actorName:actor.name||null,before:previous||{},after:value}});
    return value;
  });
}
export async function loadReportCalendars(months){
  const keys=[...new Set(months)].filter(validMonth).map(calendarKey);
  if(!keys.length)return new Map();
  const rows=await prisma.systemConfig.findMany({where:{key:{in:keys}},select:{key:true,value:true}});
  return new Map(rows.filter(row=>keys.includes(row.key)&&row.value?.revision&&Array.isArray(row.value.weekdays)).map(row=>[row.value.month,row.value]));
}
