import { normalizeCompanyName } from '../core/documentIdentity';
import { safeStr } from '../core/formatters';

/**
 * Model formulir kertas "FORM REGISTRASI OUTLET" (NOO).
 * Susunannya mengikuti formulir fisik: kotak-kotak bergaris dengan pilihan bercentang.
 * Model ini netral terhadap format; digambar oleh formPdf.js (PDF) dan formDocx.js (Word).
 *
 * Baris (line):
 *   { t: 'text', text, bold?, italic?, small?, align? }
 *   { t: 'kv', label, value, lw?, bold? }            -> "LABEL : nilai"
 *   { t: 'check', label, checked, bold? }            -> label di kiri, kotak di tepi kanan
 *   { t: 'checks', items: [{ label, checked }] }     -> beberapa pilihan sebaris, kotak setelah label
 *   { t: 'gap', h }
 * Kolom: { w (mm tetap) | fr (bagian sisa), box?, offsetY?, lines }
 * Baris blok: { columns, minH? }
 */

const MT_SUB = [
  ['HYPERMARKET', 'HYPERMARKET'],
  ['DRUGSTORE', 'DRUGSTORE'],
  ['NAT_SUPERMARKET', 'NAT SUPERMARKET'],
  ['LOKAL_SUPERMARKET', 'LOKAL SUPERMARKET'],
  ['CHAIN_MINIMARKET', 'CHAIN MINIMARKET'],
  ['LOKAL_MINIMARKET', 'LOKAL MINIMARKET'],
  ['PERKULAKAN', 'PERKULAKAN'],
];
const GT_SUB = [
  ['KOPERASI', 'KOPERASI'],
  ['BIDAN', 'BIDAN'],
  ['OUTLET_MOTORIS', 'OUTLET MOTORIS'],
  ['APOTIK', 'APOTIK'],
  ['GROSIR', 'GROSIR'],
  ['TOKO_RETAIL', 'TOKO / RETAIL'],
  ['BABY_SHOP', 'BABY SHOP / TOKO SUSU'],
];
const LOCATIONS = [
  ['DALAM_PASAR', 'DALAM PASAR'],
  ['PINGGIR_JALAN', 'PINGGIR JALAN'],
  ['DALAM_GANG', 'DALAM GANG'],
  ['KOMPLEK_PERUMAHAN', 'KOMPLEK / PERUMAHAN'],
];
const TIERS = [
  ['BRONZE_A', 'BRONZE A'],
  ['BRONZE_B', 'BRONZE B'],
  ['BRONZE_C', 'BRONZE C'],
];
const DAYS = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
const TOP_DAYS = [7, 14, 30];
const CASH_METHODS = ['TUNAI', 'GIRO', 'CEK'];

const normalize = (value) =>
  String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

/** Area pada formulir hanya empat pilihan; dicocokkan dengan nama area/cluster/kota pengajuan. */
function areaChoice(item) {
  const text = normalize([item.area, item.cluster?.name, item.city].filter(Boolean).join(' '));
  if (/BANDUNG BARAT|\bKBB\b/.test(text)) return 'KAB. BANDUNG BARAT';
  if (/KOTA BANDUNG/.test(text)) return 'KOTA BANDUNG';
  if (/KAB(UPATEN)? BANDUNG/.test(text)) return 'KAB. BANDUNG';
  if (/CIMAHI/.test(text)) return 'CIMAHI';
  return '';
}

function visitDays(item) {
  const raw = Array.isArray(item.visitDays) ? item.visitDays : String(item.visitDays ?? '').split(/[,;]/);
  return raw.map((day) => normalize(day)).filter(Boolean);
}

/** Kolom jadwal yang dicentang: dari pilihan minggu, atau interval F1 = setiap minggu. */
function visitSchedule(item) {
  const schedule = normalize(item.visitWeekSchedule).replace(/ /g, '_');
  if (['WEEK_GANJIL', 'WEEK_GENAP', 'ALL_WEEK'].includes(schedule)) return schedule;
  return Number(item.visitIntervalWeeks) === 1 ? 'ALL_WEEK' : '';
}

const check = (label, checked, extra = {}) => ({ t: 'check', label, checked, ...extra });
const kv = (label, value, lw = 22) => ({ t: 'kv', label, value: safeStr(value, ''), lw });
const text = (value, extra = {}) => ({ t: 'text', text: value, ...extra });

export function buildNooFormModel(item = {}) {
  const channel = String(item.channel || '');
  const subChannel = String(item.subChannel || '');
  const tier = String(item.channelTier || '');
  const pkp = String(item.taxType || '').toUpperCase() === 'PKP';
  const nonPkp = Boolean(item.taxType) && !pkp;
  const location = String(item.locationType || '');
  const area = areaChoice(item);
  const paymentType = String(item.paymentType || '').toUpperCase();
  const topDays = Number(item.termOfPaymentDays);
  const cashMethod = String(item.cashMethod || '').toUpperCase();
  const schedule = visitSchedule(item);
  const days = visitDays(item);
  const address = [item.address, item.address2, item.address3].filter(Boolean).join(', ');
  const fullArea = [item.area, item.cluster?.name].filter(Boolean).join(' / ');

  const identity = {
    rows: [
      {
        columns: [
          {
            fr: 1,
            lines: [
              kv('NAMA OUTLET', item.name || item.outletName),
              kv('ALAMAT OUTLET', address),
              kv('NO TELP', item.phone || item.ownerPhone),
            ],
          },
          {
            w: 56,
            lines: [
              { t: 'gap', h: 7 },
              { ...kv('KODE OUTLET', item.customerCode || item.outletCode, 21), t: 'box' },
              text('*diisi Admin', { italic: true, small: true, align: 'right' }),
            ],
          },
        ],
      },
      {
        columns: [
          {
            fr: 1,
            lines: [
              {
                t: 'checks',
                label: 'LOKASI',
                lw: 22,
                items: LOCATIONS.map(([id, label]) => ({ label, checked: location === id })),
              },
            ],
          },
        ],
      },
    ],
  };

  const tax = {
    rows: [
      {
        columns: [
          { w: 22, lines: [text('JENIS PAJAK :')] },
          {
            fr: 1.45,
            box: true,
            lines: [
              check('PKP', pkp, { bold: true }),
              kv('NO. NPWP', pkp ? item.taxNumber || item.nik : '', 20),
              kv('NAMA NPWP', pkp ? item.taxName : '', 20),
              kv('ALAMAT NPWP', pkp ? item.taxAddress : '', 20),
              text('* Lampirkan Copy NPWP / SPPKP / KTP', { italic: true, small: true }),
            ],
          },
          {
            fr: 1,
            box: true,
            lines: [
              check('NON PKP', nonPkp, { bold: true }),
              kv('NIK', nonPkp ? item.taxNumber || item.nik : '', 14),
              kv('NAMA', nonPkp ? item.taxName || item.ownerName : '', 14),
              kv('ALAMAT', nonPkp ? item.taxAddress : '', 14),
            ],
          },
        ],
      },
    ],
  };

  const territory = {
    rows: [
      {
        columns: [
          {
            fr: 1,
            lines: [
              {
                t: 'checks',
                label: 'AREA',
                lw: 22,
                items: ['CIMAHI', 'KAB. BANDUNG BARAT', 'KAB. BANDUNG', 'KOTA BANDUNG'].map((label) => ({
                  label,
                  checked: area === label,
                })),
              },
              ...(area || !fullArea ? [] : [kv('AREA LAIN', fullArea)]),
              kv('SUB AREA / KEC', item.subAreaKecamatan),
              kv('KELURAHAN', item.kelurahan),
            ],
          },
        ],
      },
    ],
  };

  const channelBlock = {
    rows: [
      {
        columns: [
          { w: 22, lines: [text('CHANEL :'), text('SUB CHANEL :')] },
          {
            fr: 1,
            box: true,
            lines: [
              check('MODERN TRADE (MT)', channel === 'MODERN_TRADE', { bold: true }),
              ...MT_SUB.map(([id, label]) => check(label, channel === 'MODERN_TRADE' && subChannel === id)),
            ],
          },
          {
            fr: 1,
            box: true,
            lines: [
              check('GENERAL TRADE (GT)', channel === 'GENERAL_TRADE', { bold: true }),
              ...GT_SUB.map(([id, label]) => check(label, channel === 'GENERAL_TRADE' && subChannel === id)),
            ],
          },
          {
            w: 34,
            lines: [
              text('CHANEL', { align: 'right', small: true }),
              ...TIERS.map(([id, label]) => check(label, tier === id)),
            ],
          },
        ],
      },
    ],
  };

  const topLines = TOP_DAYS.map((day) => check(`${day} HARI`, paymentType === 'TOP' && topDays === day));
  const otherTop =
    paymentType === 'TOP' && topDays > 0 && !TOP_DAYS.includes(topDays)
      ? [text(`Lainnya: ${topDays} hari`, { small: true, italic: true })]
      : [];
  const payment = {
    rows: [
      {
        columns: [
          { w: 22, lines: [text('PAYMENT :')] },
          {
            fr: 1,
            box: true,
            lines: [check('TERM OF PAYMENT (TOP)', paymentType === 'TOP'), ...topLines, ...otherTop],
          },
          {
            fr: 1,
            box: true,
            lines: [
              check('CASH PAYMENT', paymentType === 'CASH'),
              ...CASH_METHODS.map((method) => check(method, paymentType === 'CASH' && cashMethod === method)),
            ],
          },
          {
            fr: 1.1,
            lines: [
              text('KHUSUS PEMBAYARAN TRANSFER', { bold: true, small: true }),
              text('NO REKENING : 7774628887', { bold: true, small: true }),
              text('BANK BCA', { bold: true, small: true }),
              text(normalizeCompanyName('').toUpperCase(), { bold: true, small: true }),
            ],
          },
        ],
      },
    ],
  };

  const visitColumn = (key, title) => ({
    fr: 1,
    box: true,
    lines: [
      text(title, { bold: true }),
      ...DAYS.map((day) => check(day, schedule === key && days.includes(day))),
    ],
  });
  const visit = {
    rows: [
      {
        columns: [
          { w: 22, lines: [text('KUNJUNGAN :')] },
          visitColumn('WEEK_GANJIL', 'WEEK GANJIL'),
          visitColumn('WEEK_GENAP', 'WEEK GENAP'),
          visitColumn('ALL_WEEK', 'ALL WEEK'),
        ],
      },
    ],
  };

  const mapping = {
    rows: [
      {
        minH: 30,
        columns: [
          {
            fr: 1,
            lines: [text('Mapping Lokasi :', { bold: true, small: true }), text(safeStr(item.mappingLocation, ''))],
          },
        ],
      },
    ],
  };

  return {
    title: 'FORM REGISTRASI OUTLET',
    meta: [
      { label: 'DIVISI', value: safeStr(item.divisionName || item.division, '') },
      { label: 'CABANG', value: safeStr(item.branch, '') },
    ],
    blocks: [identity, tax, territory, channelBlock, payment, visit],
    footnote: '* Beri Tanda V Pada Kolom Pilihan',
    mapping,
  };
}
