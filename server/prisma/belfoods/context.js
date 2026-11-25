import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG_DEFAULTS } from '../../../shared/config.mjs';
import { wibDateKey } from '../../../shared/visit-metrics.mjs';
import { CURATED_OUTLET_COMPLETIONS, normalizeAddress } from './completions.js';

export const seedDate = () => {
  const key = process.env.SEED_DATE || wibDateKey();
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(key) ||
    new Date(`${key}T00:00:00Z`).toISOString().slice(0, 10) !== key
  ) {
    throw new Error('SEED_DATE harus YYYY-MM-DD valid');
  }
  return key;
};

export const at = (dateKey, time = '08:00') => new Date(`${dateKey}T${time}:00+07:00`);

export const offsetDate = (key, days) =>
  new Date(new Date(`${key}T12:00:00Z`).getTime() + days * 86400000).toISOString().slice(0, 10);

export function assertDemoDatabase() {
  if (process.env.ALLOW_EXTERNAL_SEED === 'true' || process.env.ALLOW_PRODUCTION_SEED === 'true') {
    return;
  }
  const host = new URL(process.env.DATABASE_URL).hostname;
  if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) {
    throw new Error(
      'Seed demo hanya diizinkan pada database lokal; tidak mengisi database eksternal dengan data contoh.'
    );
  }
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(HERE, '..', '..', '..');
const SOURCE_PATH = path.join(WORKSPACE_ROOT, 'KUNJUNGAN_TOKO_BELFOODS_CONVERTED.json');

export const id = (key) => {
  const hash = createHash('sha256').update(`belfoods-connected-v2:${key}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
};

export const ensure = (db, model, key, data) =>
  db[model].upsert({
    where: { id: id(key) },
    update: {},
    create: { id: id(key), ...data },
  });

export const email = (key) => `${key}@sinaranugrah.com`;

export const note = 'Operasional CV. Sinar Anugrah Divisi Belfoods Bandung Raya.';

// Lean demo team: one Supervisor for both channels, one Sales per channel (GT, MT), plus Admin,
// warehouse head and one driver. E-mail is the first name only.
export const people = [
  ['admin', 'Rina Hartati', 'ADMIN', 'ADM01', null],
  ['pian', 'Pian Sopiandi', 'SUPERVISOR', 'SPV01', null],
  ['cahya', 'Cahya Pratama', 'SALES', 'SLD514', 0],
  ['yuli', 'Yulianti', 'SALES', 'SLD539', 0],
  ['gudang', 'Bambang Supriatna', 'KEPALA_GUDANG', 'WH01', null],
  ['andri', 'Andri Setiawan', 'SUPIR', 'DRV01', null],
];

/**
 * Real callplan owners in the source file. Only the sales listed in CLUSTER_DEFS are part of the
 * demo; every other source outlet is still loaded but stays unassigned (no cluster, no sales, no PJP).
 */
export const SOURCE_SALES = {
  SLD514: {
    channel: 'GENERAL_TRADE',
    itineraryCode: 'F2',
    region: 'Cimahi & Kabupaten Bandung Barat',
  },
  SLD516: {
    channel: 'GENERAL_TRADE',
    itineraryCode: 'F2',
    region: 'Kota Bandung Selatan & Kabupaten Bandung',
  },
  SLD515: { channel: 'MODERN_TRADE', itineraryCode: 'F4', region: 'Kota Bandung & Bandung Utara' },
  SLD517: { channel: 'MODERN_TRADE', itineraryCode: 'F1', region: 'Kota Bandung Pusat & Timur' },
  SLD539: { channel: 'MODERN_TRADE', itineraryCode: 'F1', region: 'Bandung Raya & Cimahi' },
};

export const UNASSIGNED_CLUSTER = {
  code: 'BF-UNASSIGNED',
  name: 'Belum Ditugaskan',
  region: 'Belum ditetapkan',
  colorHex: '#697280',
};

/**
 * Compact territories, each built from the real callplan stops of its Sales that lie closest to
 * `center`: a cluster is a contiguous area one person can cover, not a copy of a whole callplan.
 */
export const CLUSTER_DEFS = [
  {
    code: 'BF-GT-CMH',
    name: 'GT Kota Cimahi',
    region: 'Kota Cimahi',
    salesKey: 'cahya',
    staffCode: 'SLD514',
    channel: 'GENERAL_TRADE',
    itineraryCode: 'F2',
    colorHex: '#1b66ca',
    center: [-6.89, 107.532],
    size: 20,
  },
  {
    code: 'BF-GT-LMB',
    name: 'GT Lembang & Parongpong',
    region: 'Lembang & Parongpong, Kabupaten Bandung Barat',
    salesKey: 'cahya',
    staffCode: 'SLD514',
    channel: 'GENERAL_TRADE',
    itineraryCode: 'F2',
    colorHex: '#0f766e',
    center: [-6.839, 107.598],
    size: 14,
  },
  {
    code: 'BF-MT-CMH',
    name: 'MT Cimahi & Padalarang',
    region: 'Cimahi & Padalarang',
    salesKey: 'yuli',
    staffCode: 'SLD539',
    channel: 'MODERN_TRADE',
    itineraryCode: 'F1',
    colorHex: '#0369a1',
    center: [-6.871, 107.52],
    size: 7,
  },
  {
    code: 'BF-MT-BDG',
    name: 'MT Bandung Utara',
    region: 'Kota Bandung Utara',
    salesKey: 'yuli',
    staffCode: 'SLD539',
    channel: 'MODERN_TRADE',
    itineraryCode: 'F1',
    colorHex: '#334155',
    center: [-6.894, 107.612],
    size: 12,
  },
];

export const operationalPolicy = (day, extra = {}) => ({
  provenance: 'SINAR_ANUGRAH_OPERATIONAL',
  at: `${day}T00:00:00+07:00`,
  versions: [],
  values: {
    ...CONFIG_DEFAULTS,
    TAX_RATE_PERCENT: 0,
    CODE_INVOICE_MODE: 'INCREMENT',
    CODE_PJP_MODE: 'INCREMENT',
    SALES_REQUIRE_GPS: true,
    SALES_IN_PHOTO: 'OPTIONAL',
    SALES_OUT_PHOTO: 'OPTIONAL',
    ATTENDANCE_REQUIRE_PHOTO: false,
    ATTENDANCE_ENFORCE_GEOFENCE: false,
    GPS_REQUIRE_METADATA: false,
    DELIVERY_REQUIRE_GPS: true,
    DELIVERY_REQUIRE_PHOTO: false,
    DELIVERY_REQUIRE_GEOFENCE: false,
    ...extra,
  },
});

/**
 * Returns Mon-Sat working day integer (1..6) for a YYYY-MM-DD key.
 * If dateKey falls on Sunday (0), maps to Saturday (6) so operations never have 0 scheduled stops.
 */
export function activeWorkingDay(dateKey) {
  const dow = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
  return dow === 0 ? 6 : dow;
}

/**
 * Returns `count` YYYY-MM-DD Mon-Sat working days strictly before `dateKey`, ordered oldest -> newest.
 */
export function workingDaysBack(dateKey, count = 2) {
  const found = [];
  let cursor = dateKey;
  while (found.length < count) {
    cursor = new Date(new Date(`${cursor}T12:00:00Z`).getTime() - 86400000)
      .toISOString()
      .slice(0, 10);
    if (new Date(`${cursor}T12:00:00Z`).getUTCDay() !== 0) {
      found.unshift(cursor);
    }
  }
  return found;
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function classifySubChannel(name, isMt) {
  const upper = name.toUpperCase();
  if (isMt) {
    if (upper.includes('TRANSMART') || upper.includes('HYPER')) return 'HYPERMARKET';
    if (upper.includes('INDOMARET') || upper.includes('INDOMART')) return 'CHAIN_MINIMARKET';
    if (upper.includes('ALFAMART') || upper.includes('ALFAMIDI') || upper.includes('YOMART')) {
      return 'CHAIN_MINIMARKET';
    }
    if (
      upper.includes('BORMA') ||
      upper.includes('YOGYA') ||
      upper.includes('GRIYA') ||
      upper.includes('SUPERINDO') ||
      upper.includes('PRAMA')
    ) {
      return 'LOKAL_SUPERMARKET';
    }
    return 'LOKAL_MINIMARKET';
  }
  if (upper.includes('GROSIR') || upper.includes('DEPO')) return 'GROSIR';
  if (upper.includes('KOPERASI') || upper.includes('KOP.')) return 'KOPERASI';
  if (upper.includes('WARUNG') || upper.includes('WR ')) return 'WARUNG';
  if (upper.includes('FROZEN') || upper.includes('BASO') || upper.includes('MART'))
    return 'TOKO_RETAIL';
  return 'TOKO_KELONTONG';
}

function inferOwnerName(customerName, index) {
  const cleaned = customerName.trim();
  const personMatch = /\b(pak|bu|ibu|hj\.?|h\.)\s+([A-Za-z]+)/i.exec(cleaned);
  if (personMatch) {
    const title = personMatch[1].replace(/\./g, '');
    const person = personMatch[2].charAt(0).toUpperCase() + personMatch[2].slice(1).toLowerCase();
    return `${title.charAt(0).toUpperCase() + title.slice(1).toLowerCase()} ${person}`;
  }
  const firstNames = [
    'Hendra',
    'Agus',
    'Asep',
    'Dedi',
    'Yanti',
    'Lina',
    'Rudi',
    'Siti',
    'Wawan',
    'Nana',
  ];
  const lastNames = [
    'Saputra',
    'Kurniawan',
    'Permana',
    'Hidayat',
    'Mulyana',
    'Lestari',
    'Santoso',
    'Wijaya',
    'Setiawan',
    'Rahayu',
  ];
  return `${firstNames[index % firstNames.length]} ${lastNames[(index * 3) % lastNames.length]}`;
}

export function deterministicPhone(index) {
  const mid = String(1000 + ((index * 73) % 8999)).padStart(4, '0');
  const tail = String(1000 + ((index * 137) % 8999)).padStart(4, '0');
  return `0812${mid}${tail}`;
}

export function deterministicNpwp(index) {
  const num = String(100000 + index * 37).padStart(6, '0');
  return `01.452.${num.slice(0, 3)}.${index % 9}-428.000`;
}

let cachedSource = null;

export function sourceData() {
  if (cachedSource) return structuredClone(cachedSource);
  const rawPlans = JSON.parse(readFileSync(SOURCE_PATH, 'utf8'));
  const outlets = [];
  const plans = [];

  for (const plan of rawPlans) {
    const salesCode = plan.nama_sales.split(/\s+/)[0];
    const profile = SOURCE_SALES[salesCode];
    if (!profile) throw new Error(`Sales code tidak dikenal pada JSON sumber: ${salesCode}`);
    const isMt = profile.channel === 'MODERN_TRADE';
    const weekType = /\bW1\b/i.test(plan.nama_sales)
      ? 'WEEK_1'
      : /\bW2\b/i.test(plan.nama_sales)
        ? 'WEEK_2'
        : 'ALL';

    const dayEntries = Object.values(plan.jadwal_harian || {});
    for (const dayEntry of dayEntries) {
      for (const [seqIdx, k] of (dayEntry.kunjungan || []).entries()) {
        const curation = CURATED_OUTLET_COMPLETIONS[k.customer_id] || {};
        const rawLat =
          curation.latitude ??
          (k.latitude === null || k.latitude === '' ? null : Number(k.latitude));
        const rawLng =
          curation.longitude ??
          (k.longitude === null || k.longitude === '' ? null : Number(k.longitude));
        if (!Number.isFinite(rawLat) || !Number.isFinite(rawLng) || rawLat === 0 || rawLng === 0) {
          throw new Error(
            `Koordinat outlet ${k.customer_id} (${k.customer_name}) masih tidak valid`
          );
        }
        const address = normalizeAddress(curation.address ?? k.address, profile.region);
        const name = k.customer_name.trim().replace(/\s+/g, ' ');
        const idx = outlets.length;
        const subChannel = classifySubChannel(name, isMt);

        outlets.push({
          customer_id: k.customer_id.trim(),
          customer_name: name,
          address,
          latitude: Number(rawLat),
          longitude: Number(rawLng),
          geocode_confidence: k.geocode_confidence || 'curated',
          catatan_validasi:
            k.catatan_validasi || 'Terverifikasi terhadap daftar pelanggan Belfoods Bandung Raya',
          callplanId: plan.callplan_id,
          salesCode,
          salesLabel: plan.nama_sales,
          weekType,
          dayOfWeek: dayEntry.day_of_week,
          dayLabel: dayEntry.hari,
          sequence: seqIdx + 1,
          // Assignment is decided below; until then every outlet is unassigned.
          assigned: false,
          clusterCode: UNASSIGNED_CLUSTER.code,
          channel: profile.channel,
          subChannel,
          itineraryCode: profile.itineraryCode,
          ownerName: inferOwnerName(name, idx),
          phone: deterministicPhone(idx),
          taxType: isMt ? 'PKP' : 'NON_PKP',
          taxNumber: deterministicNpwp(idx),
          paymentType: isMt ? 'TOP' : idx % 3 === 0 ? 'CASH' : 'TOP',
          termOfPaymentDays: isMt ? 14 : idx % 3 === 0 ? 0 : 7,
          curatedFromMissing: Boolean(CURATED_OUTLET_COMPLETIONS[k.customer_id]),
        });
      }
    }
    plans.push({
      callplanId: plan.callplan_id,
      namaSales: plan.nama_sales,
      salesCode,
      weekType,
      totalKunjunganMingguan: plan.total_kunjungan_mingguan,
    });
  }

  // Build each territory from the nearest real stops of its Sales (a stop belongs to one cluster).
  for (const def of CLUSTER_DEFS) {
    const taken = outlets
      .filter((o) => o.salesCode === def.staffCode && !o.assigned)
      .map((o) => ({
        o,
        d: haversineKm(def.center[0], def.center[1], o.latitude, o.longitude),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, def.size);
    for (const { o } of taken) {
      o.assigned = true;
      o.clusterCode = def.code;
    }
  }

  // Keep every working day usable: a Sales with fewer than 2 stops on a weekday (current-week plan)
  // gets the nearest real stop of that same weekday (within 10 km) added to the closest territory.
  for (const staffCode of new Set(CLUSTER_DEFS.map((d) => d.staffCode))) {
    const defs = CLUSTER_DEFS.filter((d) => d.staffCode === staffCode);
    for (let dow = 1; dow <= 6; dow++) {
      const weekly = (o) =>
        o.salesCode === staffCode && o.dayOfWeek === dow && o.weekType !== 'WEEK_2';
      const have = () => outlets.filter((o) => weekly(o) && o.assigned).length;
      const pool = outlets.filter((o) => weekly(o));
      if (!pool.length) continue;
      while (have() < 2) {
        const next = outlets
          .filter((o) => weekly(o) && !o.assigned)
          .map((o) => {
            const nearest = defs
              .map((d) => ({
                d,
                km: haversineKm(d.center[0], d.center[1], o.latitude, o.longitude),
              }))
              .sort((x, y) => x.km - y.km)[0];
            return { o, ...nearest };
          })
          .filter((x) => x.km <= 10)
          .sort((x, y) => x.km - y.km)[0];
        if (!next) break;
        next.o.assigned = true;
        next.o.clusterCode = next.d.code;
      }
    }
  }

  cachedSource = {
    source: 'KUNJUNGAN_TOKO_BELFOODS_CONVERTED.json',
    summary: {
      sourceRows: outlets.length,
      uniqueOutletCodes: new Set(outlets.map((o) => o.customer_id)).size,
      physicalSales: Object.keys(SOURCE_SALES).length,
      callplanVariants: plans.length,
      assignedOutlets: outlets.filter((o) => o.assigned).length,
    },
    plans,
    outlets,
  };
  return structuredClone(cachedSource);
}
