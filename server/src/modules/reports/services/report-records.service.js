import { prisma } from '../../../config/prisma.js';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
function indexRows(rows,dateField,byDay) {
  const grouped=new Map();
  for(const row of rows){const userId=row.userId || row.user?.id;const key=byDay?`${userId}:${wibDateKey(row[dateField])}`:userId;if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(row);}
  return grouped;
}
export async function loadReportRecords(salesIds,start,end,{byDay=false,includeOutlets=false}={}) {
  if(!salesIds.length)return {pjps:new Map(),offVisits:new Map()};
  const userId={in:salesIds},period={gte:start,lte:end};
  const [pjps,offVisits]=await Promise.all([
    prisma.pjp.findMany({where:{userId,date:period},include:{stops:{include:{...(includeOutlets?{outlet:true}:{}),attendances:true,orders:{include:{items:true}}}}}}),
    prisma.offPjpAttendance.findMany({where:{userId,status:'APPROVED',createdAt:period}}),
  ]);
  return {pjps:indexRows(pjps,'date',byDay),offVisits:indexRows(offVisits,'createdAt',byDay)};
}
