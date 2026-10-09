/** deleteUser - single-responsibility service (extracted from users.service.js). */
import { prisma } from '../../../config/prisma.js';
import {protectAdminRecovery} from './admin-recovery.service.js';
import {getIo} from '../../../config/socket.js';
import {assertReviewersRemain} from '../../config/services/approval-readiness.service.js';


export const deleteUser = async (id) => {
  const removed=await prisma.$transaction(async db=>{
   await protectAdminRecovery(db,id,null);
   await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
   await assertReviewersRemain(db,{patches:{[id]:{deletedAt:new Date()}}});
   return db.user.update({
    where: { id },
    data: { deletedAt: new Date(),tokenVersion:{increment:1} },
   });
  });
  getIo()?.in(`user:${id}`).disconnectSockets(true);
  return removed;
};
