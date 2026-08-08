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

const DAY_ORDER = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
const DAY_LABELS = {
  senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu',
  kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu',
};
const FULL_DAYS = 5;       // Senin-Jumat
const SATURDAY_FACTOR = 0.5; // Sabtu 50%

/** Haversine distance in km */
export const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

/** Dapatkan tanggal Senin dari minggu yang berisi `date` */
export const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Minggu, 1=Senin ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

/** Tambah n hari ke date */
const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

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

/**
 * Greedy nearest-neighbor: urutkan outlet berdasarkan kedekatan,
 * lalu potong berurutan sesuai quota -> setiap cluster berisi outlet terdekat.
 * Urutan dalam cluster sudah optimal (jalur rute terpendek secara greedy).
 *
 * @param {Array<{id:string, latitude:number, longitude:number}>} outlets
 * @param {Record<string, number>} quotas
 * @returns {Array<{ day:string, outlets:Array, totalDistanceKm:number }>}
 */
export const assignByProximity = (outlets, quotas) => {
  const remaining = [...outlets];
  const sorted = []; // urutan greedy global

  // Mulai dari outlet paling utara-barat (deterministik) lalu rantai terdekat
  remaining.sort((a, b) => a.latitude - b.latitude || a.longitude - b.longitude);

  let current = remaining.shift();
  sorted.push(current);
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(current.latitude, current.longitude, remaining[i].latitude, remaining[i].longitude);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    current = remaining.splice(bestIdx, 1)[0];
    sorted.push(current);
  }

  // Potong berurutan sesuai quota
  const result = [];
  let cursor = 0;
  for (const day of DAY_ORDER) {
    const q = quotas[day] || 0;
    const slice = sorted.slice(cursor, cursor + q);
    cursor += q;
    if (slice.length === 0) continue;

    // Hitung total jarak rute (informasi untuk optimasi manual)
    let totalDistanceKm = 0;
    for (let i = 1; i < slice.length; i++) {
      totalDistanceKm += haversineKm(
        slice[i - 1].latitude, slice[i - 1].longitude,
        slice[i].latitude, slice[i].longitude,
      );
    }
    result.push({ day, outlets: slice, totalDistanceKm: Math.round(totalDistanceKm * 100) / 100 });
  }
  return result;
};

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

export { DAY_ORDER, DAY_LABELS };
