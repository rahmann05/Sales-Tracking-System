/** deleteDeliveryRoute - single-responsibility service (extracted from delivery.service.js). */
import {routeAction} from './operations.service.js';

/**
 * Delete delivery route (only if DRAFT)
 */
export const deleteDeliveryRoute = async (id,user) => {
  await routeAction(id,{action:'CANCEL',note:'Dibatalkan melalui tindakan hapus rute; riwayat dipertahankan.'},user);
  return { message: 'Rute dibatalkan dan riwayat dipertahankan' };
};
