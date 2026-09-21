/** buildSalesClusterPlan - single-responsibility service (extracted from cluster-generator.service.js). */
import { DAY_LABELS } from './cluster-generator.helpers.js';
import { splitIntoDayQuotas } from './split-into-day-quotas.service.js';
import { assignByProximity } from './assign-by-proximity.service.js';

/**
 * Bangun rencana cluster untuk satu sales (tanpa menyimpan ke DB).
 * @param {string} salesName
 * @param {Array} outlets - outlet unik milik sales
 * @returns {Array<{ day:string, dayLabel:string, clusterName:string, outlets:Array, totalDistanceKm:number }>}
 */
export const buildSalesClusterPlan = (salesName, outlets) => {
  const quotas = splitIntoDayQuotas(outlets.length);
  const groups = assignByProximity(outlets, quotas);
  return groups.map((g) => ({
    day: g.day,
    dayLabel: DAY_LABELS[g.day],
    clusterName: `${salesName} - ${DAY_LABELS[g.day]}`,
    outlets: g.outlets,
    totalDistanceKm: g.totalDistanceKm,
  }));
};
