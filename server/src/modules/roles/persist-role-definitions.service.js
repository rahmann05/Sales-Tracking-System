import {isDeepStrictEqual} from 'node:util';
import {prisma} from '../../config/prisma.js';
import {getIo} from '../../config/socket.js';
import {AppError} from '../../utils/errors.js';
import {assertReviewersRemain} from '../config/services/approval-readiness.service.js';
const normalize=list=>list.map(({userCount,...role})=>({...role,baseRole:role.isSystem?role.code:role.baseRole||'SALES'}));
export async function persistRoleDefinitions(previous,next,{revokeCode,deleteCode,actor={}}={}){
 const ids=await prisma.$transaction(async db=>{
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
  const current=(await db.systemConfig.findUnique({where:{key:'ROLE_DEFINITIONS'}}))?.value||[];
  if(!isDeepStrictEqual(normalize(current),normalize(previous)))throw new AppError('Definisi role berubah. Muat ulang sebelum menyimpan.',409);
  if(deleteCode&&await db.user.count({where:{roleCode:deleteCode,deletedAt:null}}))throw new AppError('Role masih digunakan pengguna aktif. Ubah penugasan terlebih dahulu.',409);
  await assertReviewersRemain(db,{definitions:next});
  await db.systemConfig.upsert({where:{key:'ROLE_DEFINITIONS'},create:{key:'ROLE_DEFINITIONS',value:next},update:{value:next}});
  await db.auditEvent.create({data:{entityType:'ROLE_DEFINITIONS',entityId:revokeCode||deleteCode||'ROLES',action:deleteCode?'DELETE':revokeCode?'UPDATE_PERMISSIONS':'SAVE',actorId:actor.id||null,actorName:actor.name||null,before:{roles:current},after:{roles:next,revokedRole:revokeCode||null}}});
  if(!revokeCode)return [];
  const where={deletedAt:null,OR:[{roleCode:revokeCode},{roleCode:null,role:revokeCode}]};
  // A custom code is not a Prisma Role enum.
  if(!['ADMIN','SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR'].includes(revokeCode))where.OR=[{roleCode:revokeCode}];
  const users=await db.user.findMany({where,select:{id:true}});
  await db.user.updateMany({where,data:{tokenVersion:{increment:1}}});
  return users.map(p=>p.id);
 },{timeout:30000});
 for(const id of ids)getIo()?.in(`user:${id}`).disconnectSockets(true);
}
