import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
// Minimal assignment choices; managing territory does not grant access to the Team screen.
export async function clusterTeamOptions(actor) {
  if (
    !['ADMIN', 'SUPERVISOR'].includes(actor.role) ||
    actor.permissions?.can_manage_clusters === false
  )
    throw new AppError('Tidak berwenang mengatur wilayah', 403);
  const [sales, supervisors] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: 'SALES',
        deletedAt: null,
        ...(actor.role === 'SUPERVISOR' ? { supervisorId: actor.id } : {}),
      },
      select: {
        id: true,
        name: true,
        supervisorId: true,
        assignedClusters: {
          where: { deletedAt: null },
          select: { id: true, name: true, region: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: {
        role: 'SUPERVISOR',
        deletedAt: null,
        ...(actor.role === 'SUPERVISOR' ? { id: actor.id } : {}),
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            teamMembers: { where: { role: 'SALES', deletedAt: null } },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ]);
  return { sales, supervisors };
}
