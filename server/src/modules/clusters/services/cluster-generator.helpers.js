/** Shared helpers for cluster-generator services (internal). */
/**
 * Cluster Generator Service
 *
 * Aturan bisnis (dari Manager Operasional):
 * 1. Kumpulkan outlet unik milik sales (master pool).
 * 2. Bagi ke 6 hari kerja (Senin-Sabtu, Minggu libur).
 *    - Hari biasa (Senin-Jumat): base = ceil(total / 5.5) outlet.
 *    - Sabtu: 50% dari hari biasa -> ceil(base / 2).
 *    - Sisa didistribusikan merata mulai dari Senin.
 * 3. Pengelompokan berdasarkan jarak: greedy nearest-neighbor sehingga
 *    1 cluster hanya berisi outlet-outlet yang berdekatan secara geografis.
 * 4. Setiap cluster menjadi 1 PJP (dengan PjpStops berurutan sesuai rute terdekat).
 */
export const DAY_ORDER = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];


export const DAY_LABELS = {
  senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu',
  kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu',
};


export const FULL_DAYS = 5;

// Senin-Jumat
export const SATURDAY_FACTOR = 0.5;

/** Tambah n hari ke date */
export const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};
