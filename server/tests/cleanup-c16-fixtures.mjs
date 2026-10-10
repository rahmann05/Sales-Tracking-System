import 'dotenv/config';
import {prisma} from '../src/config/prisma.js';
if(!['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname))throw new Error('Local fixtures only.');
const users=await prisma.user.findMany({where:{name:{startsWith:'c16-'}},select:{id:true,name:true}}),tags=[...new Set(users.filter(u=>/^c16-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(u.name)).map(u=>u.name))];
try{for(const tag of tags){const ids=users.filter(u=>u.name===tag).map(u=>u.id);await prisma.$transaction(async db=>{
 const outlets=await db.outlet.findMany({where:{name:{startsWith:tag},cluster:{name:tag}},select:{id:true}}),outletIds=outlets.map(o=>o.id);
 const requests=await db.routeChangeRequest.findMany({where:{reportedBy:{in:ids}},select:{id:true}});
 for(const id of ids)await db.systemConfig.deleteMany({where:{OR:[{key:{startsWith:`_OFF_PJP_REQUEST:${id}:`}},{key:{startsWith:`_MASTER_IMPORT:${id}:`}}]}});
 await db.systemConfig.deleteMany({where:{key:{in:requests.map(r=>'_ROUTE_CHANGE_WORKFLOW:'+r.id)}}});
 await db.auditEvent.deleteMany({where:{actorId:{in:ids}}});await db.notification.deleteMany({where:{userId:{in:ids}}});
 await db.offPjpAttendance.deleteMany({where:{userId:{in:ids}}});await db.staffActivity.deleteMany({where:{userId:{in:ids}}});await db.routeChangeRequest.deleteMany({where:{reportedBy:{in:ids}}});await db.pjp.deleteMany({where:{userId:{in:ids}}});
 await db.outletChange.deleteMany({where:{outletId:{in:outletIds}}});await db.outlet.deleteMany({where:{id:{in:outletIds}}});await db.customerRegistration.deleteMany({where:{name:tag+'-registration',salesmanId:{in:ids}}});
 await db.cluster.deleteMany({where:{name:tag,supervisorId:{in:ids}}});await db.product.deleteMany({where:{sku:{startsWith:tag}}});await db.vehicle.deleteMany({where:{code:{startsWith:tag}}});await db.user.deleteMany({where:{id:{in:ids}}});
 });}console.log(`Cleaned ${tags.length} isolated C16 fixture run(s).`);}finally{await prisma.$disconnect();}
