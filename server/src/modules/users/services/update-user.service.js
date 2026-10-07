import { userAssignment } from '../../roles/role-assignment.service.js';
/** updateUser - single-responsibility service (extracted from users.service.js). */
import bcrypt from 'bcryptjs';
import { prisma } from '../../../config/prisma.js';
import { USER_SELECT, enrichUserResponse } from './users.helpers.js';


export const updateUser = async (id, raw) => {
  const current = await prisma.user.findUnique({where:{id},select:{role:true,clusterId:true}});
  const data = await userAssignment(raw,current);
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: USER_SELECT,
  });
  return enrichUserResponse(updated);
};
