/** Shared helpers for delivery services (internal). */
import { resolveBusinessCode } from '../../config/services/business-code.service.js';

// ═══════════════════════════════════════════════════════════════
// PACKING LIST
// ═══════════════════════════════════════════════════════════════

/**
 * Generate unique packing list code: PL-YYYYMMDD-NNN
 */
export const generatePackingListCode = async (manualCode) => resolveBusinessCode('PACKING_LIST',manualCode);

// ═══════════════════════════════════════════════════════════════
// DELIVERY ROUTE
// ═══════════════════════════════════════════════════════════════

/**
 * Generate unique delivery route code: DR-YYYYMMDD-A01
 */
export const generateRouteCode = async (date,manualCode) => resolveBusinessCode('DELIVERY_ROUTE',manualCode,{date:new Date(date)});
