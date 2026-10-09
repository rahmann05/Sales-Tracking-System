import {getIo} from '../../../config/socket.js';
import { userAssignment,roleDefinition } from '../../roles/role-assignment.service.js';
/** updateUser - single-responsibility service (extracted from users.service.js). */
import bcrypt from 'bcryptjs';
import { prisma } from '../../../config/prisma.js';
import { USER_SELECT, enrichUserResponse } from './users.helpers.js';
import {protectAdminRecovery} from './admin-recovery.service.js';
import {AppError} from '../../../utils/errors.js';
import {assertReviewersRemain} from '../../config/services/approval-readiness.service.js';


export const updateUser = async (id, raw) => {
  const current = await prisma.user.findUnique({where:{id},select:{role:true,clusterId:true}});
  const data = await userAssignment(raw,current);
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  const accessChanged=Boolean(data.password)||data.role!==undefined||data.permissions!==undefined;
  if(accessChanged)data.tokenVersion={increment:1};
  const updated = await prisma.$transaction(async db=>{
   const fresh=await protectAdminRecovery(db,id,data.role??current?.role);
   await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
   if(data.role!==undefined)await roleDefinition(data.roleCode||data.role);
   // Re-read under the same lock as account deletion and demotion.
   if(data.role===undefined&&fresh.role!==current?.role)throw new AppError('Role pengguna berubah. Muat ulang sebelum menyimpan.',409);
   if(data.role!==undefined||data.permissions!==undefined)await assertReviewersRemain(db,{patches:{[id]:data}});
   return db.user.update({
    where: { id },
    data,
    select: USER_SELECT,
   });
  });
  if(accessChanged)getIo()?.in(`user:${id}`).disconnectSockets(true);
  return enrichUserResponse(updated);
};
