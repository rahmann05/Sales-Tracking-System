import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {assertSalesAccess,outletClusterScope} from '../../../utils/team-scope.js';
import {routeChangeWorkflow} from '../../../../../shared/route-change-workflow.mjs';
import {attachRouteWorkflows} from './route-workflow.service.js';
export async function routeReviewScope(db,actor,{activeOnly=false}={}){
 if(actor?.role==='SALES')return {reportedBy:actor.id};
 if(actor?.role!=='SUPERVISOR')return {};
 const rows=await db.systemConfig.findMany({where:{key:{startsWith:'_ROUTE_CHANGE_WORKFLOW:'},value:{path:['assignment','ownerId'],equals:actor.id}}});
 const ids=rows.filter(row=>{const flow=routeChangeWorkflow({workflow:row.value});return flow.assignment?.ownerId===actor.id&&flow.canDecide(actor);}).map(row=>row.key.slice('_ROUTE_CHANGE_WORKFLOW:'.length));
 return {OR:[{reportedByUser:{supervisorId:actor.id,...(activeOnly?{deletedAt:null}:{})}},...(ids.length?[{id:{in:ids}}]:[])]};
}
export async function assertRouteDecisionScope(db,request,actor){
 const flow=routeChangeWorkflow(request);
 if(!flow.canDecide(actor))throw new AppError(flow.assignment?`Keputusan tahap ini ditugaskan kepada ${flow.assignment.ownerName||'pemeriksa terpilih'}.`:`Pengajuan menunggu pemeriksa ${flow.stage==='ADMIN'?'Admin berbeda dari pengusul':'Supervisor'} yang aktif dan berizin.`,403);
 if(flow.assignment?.ownerId!==actor.id)await assertSalesAccess(actor,request.reportedBy,db);
}
export async function routeReplacementScope(db,request,actor){
 if(actor.role==='ADMIN')return {deletedAt:null};
 const applicant=await db.user.findUnique({where:{id:request.reportedBy},select:{supervisorId:true}});
 if(!applicant?.supervisorId)throw new AppError('Sales belum memiliki tim untuk menentukan wilayah toko pengganti.',409);
 return outletClusterScope({id:applicant.supervisorId,role:'SUPERVISOR'},db);
}
export async function routeReplacementOptions(id,query,actor){
 const found=await prisma.routeChangeRequest.findUnique({where:{id},include:{pjp:{select:{stops:{select:{outletId:true}}}}}});if(!found)throw new AppError('Pengajuan tidak ditemukan.',404);
 const [request]=await attachRouteWorkflows(prisma,[found]);await assertRouteDecisionScope(prisma,request,actor);
 if(request.status!=='PENDING_APPROVAL'||routeChangeWorkflow(request).proposal)throw new AppError('Tahap ini tidak menerima pilihan toko pengganti baru.',409);
 const cluster=await routeReplacementScope(prisma,request,actor),search=String(query.search||'').trim().slice(0,200);
 return prisma.outlet.findMany({where:{deletedAt:null,cluster,id:{notIn:request.pjp.stops.map(s=>s.outletId)},...(search?{OR:[{name:{contains:search,mode:'insensitive'}},{address:{contains:search,mode:'insensitive'}}]}:{})},select:{id:true,name:true,address:true},orderBy:[{name:'asc'},{id:'asc'}],take:100});
}
