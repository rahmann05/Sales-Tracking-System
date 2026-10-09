import { wibDateKey, wibDayRange } from '../../../../../shared/visit-metrics.mjs';
import { workingDays } from '../../../../../shared/working-calendar.mjs';
import { prisma } from '../../../config/prisma.js';
import { getDynamicConfig } from '../../config/config.service.js';
import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
import {withPolicy} from '../../config/services/policy-context.service.js';
import { resolveBusinessCode, getCodePolicy } from '../../config/services/business-code.service.js';
import { captureReportAssignment, REPORT_USER_SELECT } from '../../reports/services/report-assignment.service.js';
import {planningCalendar} from './planning-calendar.service.js';

export const getIsoWeekNumber = (date = new Date()) => {
  const d = new Date(`${wibDateKey(date)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return Math.ceil(((d - new Date(Date.UTC(d.getUTCFullYear(), 0, 1))) / 86400000 + 1) / 7);
};
export const getCurrentWeekType = (date = new Date(), mode = 'ISO_PARITY') => {
  const week = mode === 'MONTH_CYCLE' ? Math.ceil(Number(wibDateKey(date).slice(8)) / 7) : getIsoWeekNumber(date);
  return week % 2 ? 'WEEK_1' : 'WEEK_2';
};
export const PJP_STOP_INCLUDE = {
  outlet: { include: { cluster: { select: { id: true, name: true, region: true,
    users: { select: { id: true, name: true, role: true } }, supervisor: { select: { id: true, name: true } } } } } },
  attendances: true, routeChanges: true, orders: { where: { deletedAt: null }, include: { items: true } },
};
export const ensureTodayPjpForSales = async (userId, manualCode) => {
  const now = new Date();
  const key = wibDateKey(now);
  const dayOfWeek = new Date(`${key}T12:00:00Z`).getUTCDay();
  const [days, mode, fallback] = await Promise.all([
    getDynamicConfig('PJP_WORKING_DAYS', '1,2,3,4,5,6'),
    getDynamicConfig('PJP_WEEK_MODE', 'ISO_PARITY'), getDynamicConfig('PJP_FALLBACK_TO_CLUSTER', true),
  ]);
  return prisma.$transaction(async tx => {
    // All generators serialize on the same sales/day key, without altering historical plans.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pjp:${userId}:${key}`}))`;
    const existing = await tx.pjp.findFirst({ where: { userId, date: wibDayRange(now), type: 'SALES' }, include: { stops: { include: PJP_STOP_INCLUDE, orderBy: { sequence: 'asc' } } } });
    if (existing) return existing;
    if(await getDynamicConfig('FEATURE_PJP_MODE','ACTIVE')!=='ACTIVE')return null;
    if ((await getCodePolicy('PJP')).mode === 'MANUAL' && !manualCode?.trim()) return null;
    const calendar=await planningCalendar(tx,key,key);
    if(calendar.missing.length||!(calendar.workingDates?calendar.workingDates.includes(key):workingDays(days).includes(dayOfWeek)))return null;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`team:${userId}`}))`;
    const sales = await tx.user.findUnique({ where: { id: userId }, select: { ...REPORT_USER_SELECT, deletedAt: true } });
    if (!sales || sales.deletedAt || sales.role !== 'SALES' || !sales.supervisorId) return null;
    const templates = await tx.pjpTemplate.findMany({ where: { userId, dayOfWeek, weekType: { in: [getCurrentWeekType(now, mode), 'ALL'] } }, include: { stops: { orderBy: { sequence: 'asc' }, include: { outlet: {include:{cluster:{select:{supervisorId:true,deletedAt:true}}}} } } } });
    const template = templates.find(t => t.weekType !== 'ALL') || templates[0];
    let outletIds;
    if (template) outletIds = template.stops.filter(s => !s.outlet.deletedAt && !s.outlet.cluster.deletedAt && (!sales.supervisorId || s.outlet.cluster.supervisorId===sales.supervisorId)).map(s => s.outletId);
    else {
      if (!fallback || !sales.clusterId || !await tx.cluster.findFirst({where:{id:sales.clusterId,deletedAt:null,...(sales.supervisorId?{supervisorId:sales.supervisorId}:{})},select:{id:true}})) return null;
      const activeRoute = await tx.clusterRoute.findFirst({ where: { clusterId: sales.clusterId, isActive: true }, orderBy: { updatedAt: 'desc' } });
      const outlets = await tx.outlet.findMany({ where: { clusterId: sales.clusterId, deletedAt: null }, orderBy: { name: 'asc' } });
      const validIds = new Set(outlets.map(o => o.id));
      outletIds = activeRoute ? (activeRoute.outletOrder || []).map(o => typeof o === 'string' ? o : o.id).filter(id => validIds.has(id)) : outlets.map(o => o.id);
    }
    if (!outletIds.length) return null;
    return tx.pjp.create({ data: { ...captureReportAssignment(sales, 'PJP_PLAN', now), code:await resolveBusinessCode('PJP',manualCode,{db:tx,date:now}), userId, date: wibDayRange(now).gte, type: 'SALES', status: 'SCHEDULED',
      stops: { create: [...new Set(outletIds)].map((outletId,i) => ({ outletId, sequence: i+1, status: 'PENDING' })) } },
      include: { user: { select: { id: true, name: true, role: true, cluster: { include: { supervisor: { select: { id: true, name: true } } } } } }, stops: { include: PJP_STOP_INCLUDE, orderBy: { sequence: 'asc' } } } });
  });
};
export const generateTodayPjpsAllSales = async (codes = {}) => {
  const sales = await prisma.user.findMany({ where: { role: 'SALES', deletedAt: null }, select: { id: true,role:true,supervisorId:true } });
  let count = 0;
  for (const user of sales) {
    const before = await prisma.pjp.findFirst({ where: { userId: user.id, type: 'SALES', date: wibDayRange() }, select: { id: true } });
    if (!before && await withPolicy(await effectivePolicy(user),()=>ensureTodayPjpForSales(user.id,codes[user.id]))) count++;
  }
  return count;
};
