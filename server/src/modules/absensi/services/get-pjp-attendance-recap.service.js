/** getPjpAttendanceRecap - single-responsibility service (extracted from absensi.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';


export const getPjpAttendanceRecap = async (pjpId) => {
  const pjp = await prisma.pjp.findUnique({
    where: { id: pjpId },
    include: {
      user: { select: { id: true, name: true, role: true } },
      stops: {
        include: {
          outlet: true,
          attendances: {
            include: { user: { select: { id: true, name: true, role: true } } },
          },
        },
        orderBy: { sequence: 'asc' },
      },
    },
  });

  if (!pjp) throw new AppError('PJP tidak ditemukan', 404);

  return pjp;
};
