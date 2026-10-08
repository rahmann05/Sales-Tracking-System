import { prisma } from '../../../config/prisma.js';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
import { reportScopeWhere, REPORT_USER_SELECT } from './report-assignment.service.js';
function indexRows(rows,dateField,byDay) {
  const grouped=new Map();
  for(const row of rows){const userId=row.userId || row.user?.id;const key=byDay?`${userId}:${wibDateKey(row[dateField])}`:userId;if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(row);}
  return grouped;
}
export async function loadReportRecords(start,end,{byDay=false,includeOutlets=false,scope={}}={}) {
  const where=reportScopeWhere(scope),period={gte:start,lte:end};
  const [pjps,offVisits]=await Promise.all([
    prisma.pjp.findMany({where:{...where,date:period},include:{user:{select:REPORT_USER_SELECT},stops:{include:{...(includeOutlets?{outlet:true}:{}),attendances:true,orders:{include:{items:true}}}}}}),
    prisma.offPjpAttendance.findMany({where:{...where,status:'APPROVED',createdAt:period},include:{user:{select:REPORT_USER_SELECT}}}),
  ]);
  return {pjps:indexRows(pjps,'date',byDay),offVisits:indexRows(offVisits,'createdAt',byDay),rawRecords:[...pjps,...offVisits]};
}
