import {userAssignment} from '../../roles/role-assignment.service.js';
/** updatePermissions - single-responsibility service to update user feature permissions. */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';

export const updatePermissions = async (id, permissions) => {
  await userAssignment({permissions});
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) throw new AppError('User tidak ditemukan', 404);

  // permissions should be an object like { absensi: true, validasi: false }
  // We merge it with existing permissions or overwrite
  
  const user = await prisma.user.update({
    where: { id },
    data: { permissions },
    select: { id: true, name: true, email: true, role: true, permissions: true },
  });

  return user;
};
