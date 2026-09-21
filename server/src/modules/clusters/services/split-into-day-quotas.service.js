/** splitIntoDayQuotas - single-responsibility service (extracted from cluster-generator.service.js). */
import { DAY_ORDER, FULL_DAYS, SATURDAY_FACTOR } from './cluster-generator.helpers.js';

/**
 * Hitung quota outlet per hari.
 * Aturan: base = ceil(total / 5.5); Sabtu = ceil(base/2); sisa dibagi rata dari Senin.
 * @returns {{ senin:number, selasa:number, ..., sabtu:number }}
 */
export const splitIntoDayQuotas = (total) => {
  if (total <= 0) {
    return Object.fromEntries(DAY_ORDER.map((d) => [d, 0]));
  }
  const base = Math.ceil(total / (FULL_DAYS + SATURDAY_FACTOR)); // ceil(total/5.5)
  const satQuota = Math.ceil(base / 2);
  const quotas = { senin: base, selasa: base, rabu: base, kamis: base, jumat: base, sabtu: satQuota };

  let assigned = FULL_DAYS * base + satQuota;
  let overflow = assigned - total;

  // Kurangi overflow mulai dari hari dengan quota terbesar (Jumat -> Senin), jaga >= 1 jika memungkinkan
  const reduceOrder = ['jumat', 'kamis', 'rabu', 'selasa', 'senin', 'sabtu'];
  let i = 0;
  while (overflow > 0 && i < 1000) {
    const day = reduceOrder[i % reduceOrder.length];
    if (quotas[day] > 1) {
      quotas[day] -= 1;
      overflow -= 1;
    }
    i += 1;
  }
  return quotas;
};
