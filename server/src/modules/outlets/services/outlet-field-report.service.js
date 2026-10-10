import {z} from 'zod';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {wibDateKey,wibDayRange} from '../../../../../shared/visit-metrics.mjs';
import {reportScopeWhere} from '../../reports/services/report-assignment.service.js';
import {reviewActor} from './outlet-review-access.service.js';
const reportQuery=z.object({date:z.string().optional(),page:z.coerce.number().int().min(1).max(100000).default(1),salesmanId:z.string().max(128).optional(),search:z.string().trim().max(200).default('')});
export async function outletFieldVisitReport(raw,user){
 const query=reportQuery.parse(raw);
 const actor=await reviewActor(prisma,user,'can_validate_outlet');
 if(!['ADMIN','SUPERVISOR'].includes(actor.role))throw new AppError('Laporan validasi hanya untuk Admin/SPV.',403);
 const date=query.date||wibDateKey();
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(`${date}T12:00:00+07:00`))||wibDateKey(`${date}T12:00:00+07:00`)!==date)throw new AppError('Tanggal tidak valid.',400);
 const page=query.page,where={validationTaskId:{not:null},...(query.search?{outlet:{OR:['name','address','outletCode'].map(k=>({[k]:{contains:query.search,mode:'insensitive'}}))}}:{}),pjp:{...(query.salesmanId?{userId:query.salesmanId}:{}),date:wibDayRange(date),...(actor.role==='SUPERVISOR'?reportScopeWhere({supervisorId:actor.id}):{})}};
 const [rows,total]=await prisma.$transaction([prisma.pjpStop.findMany({where,include:{outlet:{select:{name:true,address:true}},pjp:{select:{date:true,code:true,user:{select:{id:true,name:true}}}}},orderBy:[{pjpId:'asc'},{sequence:'asc'}],take:50,skip:(page-1)*50}),prisma.pjpStop.count({where})]);
 return {data:rows.map(row=>({...row,validationFlag:['PENDING','RETURNED'].includes(row.validationResult?.state||'PENDING')?'PJP_VALIDATION_INCOMPLETE':null})),pagination:{page,total,totalPages:Math.max(1,Math.ceil(total/50))}};
}
