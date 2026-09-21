/** updatePjpStopDirectly - single-responsibility service (extracted from pjp.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';


export const updatePjpStopDirectly = async (pjpId, stopId, updateData) => {
  const stop = await prisma.pjpStop.findFirst({ where: { id: stopId, pjpId } });
  if (!stop) throw new AppError('PjpStop tidak ditemukan', 404);

  return await prisma.pjpStop.update({ where: { id: stopId }, data: updateData });
};
