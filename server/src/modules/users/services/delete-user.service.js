/** deleteUser - single-responsibility service (extracted from users.service.js). */
import { prisma } from '../../../config/prisma.js';


export const deleteUser = async (id) => {
  return await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};
