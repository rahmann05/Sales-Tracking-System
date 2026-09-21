/** getPjpById - single-responsibility service (extracted from pjp.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { PJP_STATUS, PJP_TYPE, ROLES } from '../../../utils/constants.js';
import { PJP_STOP_INCLUDE } from './pjp.helpers.js';


export const getPjpById = async (id, currentUser) => {
  const pjp = await prisma.pjp.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, role: true } },
      stops: { include: PJP_STOP_INCLUDE, orderBy: { sequence: 'asc' } },
    },
  });

  if (!pjp) throw new AppError('PJP tidak ditemukan', 404);

  const isOwner = pjp.userId === currentUser.id;
  const isPrivileged = [ROLES.SUPERVISOR, ROLES.ADMIN].includes(currentUser.role);
  if (!isOwner && !isPrivileged) {
    throw new AppError('Anda tidak memiliki akses ke PJP ini', 403);
  }

  return pjp;
};
