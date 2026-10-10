import {canTripAction} from '../../../../../shared/trip-permissions.mjs';
/** getDrivers - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';
import {readReviewDefinitions,reviewIdentity} from '../../config/services/approval-readiness.service.js';

/**
 * Get list of available drivers (role = SUPIR)
 */
export const getDrivers = async () => {
  const definitions=await readReviewDefinitions(prisma);
  const drivers=await prisma.user.findMany({
    where: { role: 'SUPIR', deletedAt: null },
    select: { id: true, name: true, email: true,role:true,roleCode:true,permissions:true },
    orderBy: { name: 'asc' },
  });
  return drivers.filter(driver=>{const identity=reviewIdentity(driver,definitions);return identity.permissions.can_access_driver_map!==false&&canTripAction(identity,'RETURN');}).map(({id,name,email})=>({id,name,email}));
};
