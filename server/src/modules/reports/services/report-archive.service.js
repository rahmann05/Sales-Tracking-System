import { createHash } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { targetPeriodError } from '../../../../../shared/sales-targets.mjs';
import { getMtdReport } from './get-mtd-report.service.js';
import { getWeeklyReport } from './get-weekly-report.service.js';

const scopeSchema=z.object({kind:z.enum(['MONTH','WEEK']),period:z.string()}).strict();
const createSchema=scopeSchema.extend({requestId:z.string().uuid(),reason:z.string().trim().min(5).max(1000)}).strict();
const keyFor=id=>`_REPORT_ARCHIVE:${id}`;
function adminOnly(actor){if(actor?.role!=='ADMIN'||actor.permissions?.can_view_reports===false)throw new AppError('Arsip laporan hanya untuk Admin dengan akses laporan',403);}
function parse(schema,raw){const parsed=schema.safeParse(raw);if(!parsed.success)throw new AppError('Parameter arsip tidak valid',400);const error=targetPeriodError(parsed.data.kind,parsed.data.period);if(error)throw new AppError(error,400);return parsed.data;}
// PostgreSQL JSONB may reorder object keys. Hash the canonical content, not its storage order.
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));return value;}
export const archiveHash=value=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
function verified(value){if(!value||archiveHash(value.report)!==value.digest)throw new AppError('Integritas arsip tidak cocok. Hubungi Admin sistem.',409);return value;}
function retry(saved,data,actor){const value=verified(saved.value);if(value.createdBy!==actor.id||value.kind!==data.kind||value.period!==data.period||value.reason!==data.reason)throw new AppError('Identitas permintaan arsip sudah digunakan untuk isi lain',409);return value;}
export async function createReportArchive(raw,actor){
  adminOnly(actor);const data=parse(createSchema,raw),key=keyFor(data.requestId);
  const existing=await prisma.systemConfig.findUnique({where:{key}});if(existing)return retry(existing,data,actor);
  const generated=data.kind==='MONTH'?await getMtdReport({year:Number(data.period.slice(0,4)),month:Number(data.period.slice(5))}):await getWeeklyReport({startDate:data.period});
  const report=JSON.parse(JSON.stringify(generated));
  report.basis={...report.basis,archiveNote:`Arsip perusahaan ${data.requestId}. Disimpan oleh ${actor.name||'Admin'}; alasan: ${data.reason}. Arsip tidak menutup transaksi periode.`};
  const value={id:data.requestId,kind:data.kind,period:data.period,scope:'COMPANY',reason:data.reason,createdBy:actor.id,createdByName:actor.name||null,createdAt:new Date().toISOString(),report,digest:archiveHash(report)};
  return prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
    const saved=await tx.systemConfig.findUnique({where:{key}});if(saved)return retry(saved,data,actor);
    await tx.systemConfig.create({data:{key,value}});
    const metadata=Object.fromEntries(Object.entries(value).filter(([name])=>name!=='report'));
    await tx.auditEvent.create({data:{entityType:'REPORT_ARCHIVE',entityId:key,action:'ARCHIVE_REPORT',actorId:actor.id,actorName:actor.name||null,before:{},after:metadata}});
    return value;
  });
}
export async function listReportArchives(raw,actor){
  adminOnly(actor);const {kind,period,cursor}=parse(scopeSchema.extend({cursor:z.string().uuid().optional()}),raw);
  const rows=await prisma.auditEvent.findMany({where:{entityType:'REPORT_ARCHIVE',action:'ARCHIVE_REPORT',AND:[{after:{path:['kind'],equals:kind}},{after:{path:['period'],equals:period}}]},orderBy:[{createdAt:'desc'},{id:'desc'}],take:31,...(cursor?{cursor:{id:cursor},skip:1}:{}),select:{id:true,after:true}});
  return {items:rows.slice(0,30).map(row=>row.after),nextCursor:rows.length>30?rows[29].id:null};
}
export async function getReportArchive(id,actor){
  adminOnly(actor);if(!z.string().uuid().safeParse(id).success)throw new AppError('Identitas arsip tidak valid',400);
  const row=await prisma.systemConfig.findUnique({where:{key:keyFor(id)}});if(!row)throw new AppError('Arsip tidak ditemukan',404);return verified(row.value);
}
