/** getUsers - single-responsibility service (extracted from users.service.js). */
import { prisma } from '../../../config/prisma.js';
import { USER_SELECT, enrichUserResponse } from './users.helpers.js';


export const getUsers = async (query = {}) => {
  const { role, clusterId, search } = query;
  const where = { deletedAt: null };

  if (role) where.role = role;
  if (clusterId) where.clusterId = clusterId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: USER_SELECT,
    orderBy: { createdAt: 'desc' },
  });

  return users.map(enrichUserResponse);
};
