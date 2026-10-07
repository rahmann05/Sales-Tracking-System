import {salesScope} from '../../../utils/team-scope.js';
/** getUsers - single-responsibility service (extracted from users.service.js). */
import { prisma } from '../../../config/prisma.js';
import { USER_SELECT, enrichUserResponse } from './users.helpers.js';


export const getUsers = async (query = {},currentUser=null) => {
  const { role, clusterId, search } = query;
  const where = { deletedAt: null, ...(currentUser?salesScope(currentUser):{}) };

  if (currentUser?.role==='KEPALA_GUDANG') where.role='SUPIR';
  else if (role) where.role = role;
  if (clusterId) where.clusterId = clusterId;
  if (search) {
    where.AND = [{OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { staffCode: { contains: search, mode: 'insensitive' } },
    ]}];
  }

  const users = await prisma.user.findMany({
    where,
    select: USER_SELECT,
    orderBy: { createdAt: 'desc' },
  });

  return users.map(enrichUserResponse);
};
