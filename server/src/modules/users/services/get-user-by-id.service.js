/** getUserById - single-responsibility service (extracted from users.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { USER_SELECT, enrichUserResponse } from './users.helpers.js';


export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });

  if (!user || user.deletedAt) {
    throw new AppError('User tidak ditemukan', 404);
  }
  return enrichUserResponse(user);
};
