/** deleteUser - single-responsibility service (extracted from users.service.js). */
import { prisma } from '../../../config/prisma.js';
import {protectAdminRecovery} from './admin-recovery.service.js';
import {getIo} from '../../../config/socket.js';


export const deleteUser = async (id) => {
  const removed=await prisma.$transaction(async db=>{
   await protectAdminRecovery(db,id,null);
   return db.user.update({
    where: { id },
    data: { deletedAt: new Date(),tokenVersion:{increment:1} },
   });
  });
  getIo()?.in(`user:${id}`).disconnectSockets(true);
  return removed;
};
