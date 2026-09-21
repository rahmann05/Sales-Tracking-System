/** unlockOutletDirect - single-responsibility service (extracted from outlet-lock.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { OUTLET_LOCK_STATUS, ROUTE_CHANGE_STATUS, ROLES, NOTIFICATION_TYPES } from '../../../utils/constants.js';


export const unlockOutletDirect = async (outletId) => {
  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet || outlet.deletedAt) throw new AppError('Outlet tidak ditemukan', 404);

  return await prisma.outlet.update({
    where: { id: outletId },
    data: { lockStatus: OUTLET_LOCK_STATUS.NORMAL },
  });
};
