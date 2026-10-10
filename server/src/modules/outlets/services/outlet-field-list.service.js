import {z} from 'zod';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {reviewActor} from './outlet-review-access.service.js';
import {reviewPeople} from '../../config/services/approval-readiness.service.js';
import {fieldTaskTiming} from '../../../../../shared/outlet-monitoring.mjs';
const day=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>Number.isFinite(Date.parse(`${v}T00:00:00Z`))&&new Date(`${v}T00:00:00Z`).toISOString().slice(0,10)===v,'Tanggal tidak valid');
const querySchema=z.object({page:z.coerce.number().int().min(1).max(100000).default(1),limit:z.coerce.number().int().min(1).max(100).default(25),status:z.enum(['ALL','OPEN','SUBMITTED','DONE','CANCELLED']).default('ALL'),search:z.string().trim().max(200).default(''),ownerId:z.string().max(128).default(''),reviewerId:z.string().max(128).default(''),supervisorId:z.string().max(128).default(''),from:day.optional(),to:day.optional(),waitingHours:z.coerce.number().int().min(0).max(87600).default(0),overdue:z.enum(['ALL','WORK']).default('ALL')}).strict();
export async function listOutletFieldTasks(user,raw={}){
 const q=querySchema.parse(typeof raw==='string'?{status:raw}:raw);
 if(q.from&&q.to&&q.from>q.to)throw new AppError('Tanggal mulai harus sebelum tanggal akhir.',400);
 const actor=await reviewActor(prisma,user,user.role==='SALES'?'can_submit_outlet_field':'can_review_outlet_field');
 if(!['ADMIN','SUPERVISOR','SALES'].includes(actor.role))throw new AppError('Akses tugas pemeriksaan ditolak.',403);
 if(actor.role==='SALES'&&(q.ownerId&&q.ownerId!==actor.id||q.supervisorId||q.reviewerId))throw new AppError('Sales hanya dapat membuka tugas sendiri.',403);
 if(actor.role==='SUPERVISOR'&&q.supervisorId&&q.supervisorId!==actor.id)throw new AppError('Tim berada di luar tanggung jawab Anda.',403);
 const allPeople=await reviewPeople(prisma),people=allPeople.filter(p=>!p.deletedAt);
 const personName=id=>{const p=allPeople.find(v=>v.id===id);return p?`${p.name}${p.deletedAt?' (nonaktif)':''}`:'Akun tidak tersedia';};
 const sales=people.filter(p=>p.role==='SALES'&&(actor.role==='ADMIN'||actor.role==='SALES'&&p.id===actor.id||actor.role==='SUPERVISOR'&&p.supervisorId===actor.id));
 if(q.ownerId&&!sales.some(p=>p.id===q.ownerId))throw new AppError('Sales berada di luar tim atau tidak aktif.',403);
 const teamId=q.supervisorId;
 const AND=[...(actor.role==='SALES'?[{ownerId:actor.id}]:actor.role==='SUPERVISOR'?[{review:{outlet:{cluster:{supervisorId:actor.id,deletedAt:null}}}}]:[]),...(q.ownerId?[{ownerId:q.ownerId}]:[]),...(q.reviewerId?[{reviewerId:q.reviewerId}]:[]),...(teamId?[{ownerId:{in:sales.filter(p=>p.supervisorId===teamId).map(p=>p.id)}}]:[])];
 if(q.status!=='ALL')AND.push({status:q.status});
 if(q.search)AND.push({OR:[{instructions:{contains:q.search,mode:'insensitive'}},{review:{outlet:{OR:['name','address','outletCode'].map(k=>({[k]:{contains:q.search,mode:'insensitive'}}))}}}]});
 if(q.from||q.to)AND.push({createdAt:{...(q.from?{gte:new Date(`${q.from}T00:00:00+07:00`)}:{}),...(q.to?{lt:new Date(+new Date(`${q.to}T00:00:00+07:00`)+86400000)}:{})}});
 if(q.waitingHours>0)AND.push({status:'SUBMITTED',updatedAt:{lte:new Date(Date.now()-q.waitingHours*3600000)}});
 if(q.overdue==='WORK')AND.push({status:'OPEN',dueAt:{lt:new Date()}});
 const where={AND};
 const result=await prisma.$transaction(async db=>{
  const total=await db.outletFieldTask.count({where}),totalPages=Math.max(1,Math.ceil(total/q.limit)),page=Math.min(q.page,totalPages);
  // Photos/history are fetched only for a selected task; list payload stays small.
  const items=await db.outletFieldTask.findMany({where,select:{id:true,reviewId:true,ownerId:true,reviewerId:true,status:true,revision:true,instructions:true,schedule:true,dueAt:true,createdAt:true,updatedAt:true,policySnapshot:true,pjpStopId:true,review:{select:{outletId:true,status:true,outlet:{select:{id:true,name:true,address:true,outletCode:true,cluster:{select:{id:true,name:true,supervisorId:true}}}}}}},orderBy:[{createdAt:'desc'},{id:'asc'}],skip:(page-1)*q.limit,take:q.limit});
  return {items:items.map(t=>{const {policySnapshot,...row}=t;return {...row,ownerName:personName(t.ownerId),reviewerName:personName(t.reviewerId),...fieldTaskTiming({...row,policySnapshot})};}),pagination:{page,limit:q.limit,total,totalPages}};
 },{isolationLevel:'RepeatableRead'});
 return {...result,people:{sales:sales.map(({id,name,supervisorId})=>({id,name,supervisorId})),reviewers:actor.role==='SALES'?[]:people.filter(p=>['ADMIN','SUPERVISOR'].includes(p.role)&&p.permissions.can_review_outlet_field&&(actor.role==='ADMIN'||p.role==='ADMIN'||p.id===actor.id)).map(({id,name})=>({id,name})),teams:actor.role==='ADMIN'?people.filter(p=>p.role==='SUPERVISOR').map(({id,name})=>({id,name})):[]},generatedAt:new Date().toISOString()};
}
