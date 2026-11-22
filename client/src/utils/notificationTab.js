import { TAB_IDS } from '../constants/tabIds.js';

/**
 * Resolves the target workspace tab ID for an inbox notification item based on user role.
 */
export const resolveNotificationTab = (notif, role) => {
  const text = `${notif?.type || ''} ${notif?.title || ''}`.toLowerCase();
  if (text.includes('noo') || text.includes('registrasi') || text.includes('toko baru')) {
    return role === 'SALES' ? TAB_IDS.OUTLET_REGISTRATION : TAB_IDS.OUTLET_APPROVAL;
  }
  if (text.includes('validasi outlet') || text.includes('field_task')) {
    return role === 'SALES' ? TAB_IDS.SALES_VISITS : TAB_IDS.OUTLET_VALIDATION;
  }
  if (text.includes('packing')) return TAB_IDS.DELIVERY_PACKING_LIST;
  if (text.includes('pengiriman') || text.includes('trip') || text.includes('retur')) {
    return role === 'SUPIR' ? TAB_IDS.ROLE_WORKSPACE : TAB_IDS.DELIVERY_MONITOR;
  }
  if (text.includes('order')) {
    if (role === 'SALES') return TAB_IDS.SALES_ORDERS;
    return role === 'SUPERVISOR' ? TAB_IDS.SPV_APPROVAL : TAB_IDS.ADMIN_APPROVAL;
  }
  if (
    text.includes('tutup') ||
    text.includes('kunci') ||
    text.includes('unlock') ||
    text.includes('rute') ||
    text.includes('reroute') ||
    text.includes('absen')
  ) {
    if (role === 'SALES') return TAB_IDS.SALES_VISITS;
    return role === 'SUPERVISOR' ? TAB_IDS.SPV_APPROVAL : TAB_IDS.ADMIN_APPROVAL;
  }
  return null;
};
