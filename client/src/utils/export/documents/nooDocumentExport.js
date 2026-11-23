import { createDocumentExporters } from '../core/createDocumentExporters';
import { formatCurrency, formatDateId, safeStr, sanitizeFilename } from '../core/formatters';

const LOCATION_LABELS = {
  DALAM_PASAR: 'Dalam Pasar',
  PINGGIR_JALAN: 'Pinggir Jalan',
  DALAM_GANG: 'Dalam Gang',
  KOMPLEK_PERUMAHAN: 'Komplek / Perumahan',
};

const CHANNEL_LABELS = {
  MODERN_TRADE: 'Modern Trade (MT)',
  GENERAL_TRADE: 'General Trade (GT)',
};

const VISIT_SCHEDULE_LABELS = {
  WEEK_GANJIL: 'Week Ganjil',
  WEEK_GENAP: 'Week Genap',
  ALL_WEEK: 'All Week (Setiap Minggu)',
};

function formatEnumLabel(value, map = null, fallback = 'Belum diisi') {
  const raw = safeStr(value, '');
  if (!raw) return fallback;
  if (map?.[raw]) return map[raw];
  return raw.replace(/_/g, ' ');
}

function formatPaymentSummary(item) {
  const type = safeStr(item.paymentType, '');
  if (!type) return 'Belum diisi';
  if (type === 'CASH' && safeStr(item.cashMethod, '')) {
    return `CASH (${safeStr(item.cashMethod)})`;
  }
  return type;
}

export function buildNooDocumentBlueprint(item = {}) {
  const regNo = safeStr(
    item.registrationCode ||
      (item.id ? `REG-${String(item.id).substring(0, 8).toUpperCase()}` : 'REG-BARU')
  );
  const custCode = safeStr(item.customerCode || item.outletCode, 'MENUNGGU FINALISASI');
  const status = safeStr(item.registrationStatus || item.status, 'Belum tercatat');
  const dateStr = formatDateId(item.createdAt);
  const dateCode = new Date().toISOString().split('T')[0];
  const visitDays = Array.isArray(item.visitDays)
    ? item.visitDays.join(', ')
    : safeStr(item.visitDays, '-');

  const fullAddress =
    [item.address, item.address2, item.address3].filter(Boolean).join(', ') || 'Belum diisi';
  const regionSummary = [
    safeStr(item.kelurahan, ''),
    safeStr(item.subAreaKecamatan, ''),
    safeStr(item.city, ''),
  ]
    .filter(Boolean)
    .join(' / ');

  const visitCycle = item.visitIntervalWeeks
    ? `Setiap ${item.visitIntervalWeeks} minggu`
    : formatEnumLabel(item.visitWeekSchedule, VISIT_SCHEDULE_LABELS);

  return {
    domain: 'OUTLET',
    filename: `Formulir_NOO_${custCode !== 'MENUNGGU FINALISASI' ? custCode : regNo}_${dateCode}`,
    sheetName: 'FORMULIR_NOO',
    orientation: 'portrait',
    title: 'FORMULIR RESMI PENGAJUAN PELANGGAN BARU (NOO)',
    subtitle: 'Dokumen Registrasi, Verifikasi Lapangan & Master Data Outlet ND6',
    docNumber: `${regNo} / ${custCode}`,
    metaItems: [
      { label: 'No. Registrasi', value: regNo },
      { label: 'Kode Customer (ND6)', value: custCode },
      { label: 'Tanggal Pengajuan', value: dateStr },
      { label: 'Status Persetujuan', value: status },
      {
        label: 'Divisi Distribusi',
        value: safeStr(item.divisionName || item.division, 'Belum diisi'),
      },
      { label: 'Cabang / Depo', value: safeStr(item.branch, 'Belum diisi') },
      { label: 'Wilayah / Area', value: formatEnumLabel(item.area) },
      { label: 'Salesman Pengaju', value: safeStr(item.salesmanName || item.submittedBy?.name) },
    ],
    sections: [
      {
        title: '1. Identitas Toko / Outlet & Lokasi',
        headers: ['No', 'Atribut Identitas Outlet', 'Nilai / Keterangan Tercatat'],
        rows: [
          ['1', 'Nama Toko / Outlet', safeStr(item.name || item.outletName)],
          ['2', 'Nama Pemilik (Owner)', safeStr(item.ownerName)],
          ['3', 'Nomor Telepon / WhatsApp', safeStr(item.phone || item.ownerPhone)],
          ['4', 'Alamat Lengkap Toko', fullAddress],
          ['5', 'Tipe Lokasi Toko', formatEnumLabel(item.locationType, LOCATION_LABELS)],
          ['6', 'Kelurahan / Kecamatan / Kota', regionSummary || 'Belum diisi'],
          ['7', 'Kode Pos', safeStr(item.postalCode, '-')],
          ['8', 'Patokan / Mapping Lokasi', safeStr(item.mappingLocation, 'Belum diisi')],
          [
            '9',
            'Titik Koordinat GPS',
            `Lat: ${safeStr(item.latitude, 'Belum tersedia')}, Lng: ${safeStr(item.longitude, 'Belum tersedia')}`,
          ],
          [
            '10',
            'ID Bukti Foto Lapangan',
            safeStr(item.photoId, item.photoUrl ? 'Foto terlampir' : 'Belum dilampirkan'),
          ],
        ],
        columnWidths: [8, 35, 57],
      },
      {
        title: '2. Klasifikasi Saluran, Pajak & Ketentuan Pembayaran',
        headers: ['No', 'Parameter Komersial & Pajak', 'Nilai / Keterangan Tercatat'],
        rows: [
          [
            '1',
            'Saluran Distribusi (Channel)',
            `${formatEnumLabel(item.channel, CHANNEL_LABELS)} / ${formatEnumLabel(item.subChannel)}`,
          ],
          ['2', 'Kelas / Tiering Outlet', formatEnumLabel(item.channelTier)],
          ['3', 'Status Perpajakan', formatEnumLabel(item.taxType)],
          ['4', 'Nomor NPWP / NIK 16-Digit', safeStr(item.taxNumber || item.nik, '-')],
          ['5', 'Nama Wajib Pajak (Sesuai KTP/NPWP)', safeStr(item.taxName || item.ownerName)],
          ['6', 'Alamat Pajak', safeStr(item.taxAddress || item.address)],
          ['7', 'Metode Pembayaran', formatPaymentSummary(item)],
          [
            '8',
            'Term of Payment (TOP)',
            item.termOfPaymentDays == null
              ? 'Belum diisi'
              : `${Number(item.termOfPaymentDays)} Hari`,
          ],
          [
            '9',
            'Plafon / Limit Kredit',
            item.creditLimit == null ? 'Belum diisi' : formatCurrency(item.creditLimit),
          ],
        ],
        columnWidths: [8, 35, 57],
      },
      {
        title: '3. Jadwal Kunjungan Rutin (RJP / PJP) & Verifikasi',
        headers: ['No', 'Atribut Rute & Otorisasi', 'Nilai / Keterangan Tercatat'],
        rows: [
          ['1', 'Siklus Kunjungan RJP', visitCycle],
          ['2', 'Hari Kunjungan Rutin', visitDays],
          ['3', 'Salesman Pengaju', safeStr(item.salesmanName || item.submittedBy?.name)],
          ['4', 'Supervisor Area', safeStr(item.spvName || item.supervisorName)],
          ['5', 'Admin Input Sistem', safeStr(item.adminName, 'Belum diisi')],
          [
            '6',
            'Catatan Verifikasi / Penolakan',
            safeStr(item.rejectionNote, 'Tidak ada catatan keputusan'),
          ],
        ],
        columnWidths: [8, 35, 57],
      },
    ],
    images: item.photoUrl
      ? [{ url: item.photoUrl, caption: `Foto outlet ${safeStr(item.name)}` }]
      : [],
    notes: [
      ...(!item.photoUrl ? ['Foto fisik outlet belum dilampirkan.'] : []),
      'Pembayaran transfer resmi ditujukan ke rekening BANK BCA 7774628887 a.n. CV SINAR ANUGRAH.',
      'Dokumen ini mencerminkan data pengajuan dan status keputusan yang tercatat. Ekspor tidak merupakan persetujuan atau aktivasi outlet.',
    ],
    signatories: [
      {
        role: 'Diajukan Oleh,',
        name: safeStr(item.salesmanName || item.submittedBy?.name, 'Salesman'),
        title: 'Salesman Pengaju',
      },
      {
        role: 'Diverifikasi Oleh,',
        name: safeStr(item.spvName || item.supervisorName, 'Supervisor Area'),
        title: 'Supervisor Penjualan',
      },
      {
        role: 'Disetujui & Difinalisasi,',
        name: safeStr(item.adminName, 'Admin Master Data'),
        title: 'Otorisasi Sistem ND6',
      },
    ],
  };
}

export async function buildNooPdfPreview(item = {}) {
  const blueprint = buildNooDocumentBlueprint(item);
  const { buildDocumentPdf } = await import('../core/pdfBuilder');
  const filename = `${sanitizeFilename(blueprint.filename)}.pdf`;
  try {
    const buffer = await buildDocumentPdf(blueprint);
    return {
      blob: new Blob([buffer], { type: 'application/pdf' }),
      filename,
      photoWarning: '',
    };
  } catch (error) {
    if (!blueprint.images?.length) throw error;
    const fallbackBlueprint = {
      ...blueprint,
      images: [],
      notes: [...blueprint.notes, 'Lampiran foto outlet tidak dapat dimuat pada pratinjau PDF.'],
    };
    const buffer = await buildDocumentPdf(fallbackBlueprint);
    return {
      blob: new Blob([buffer], { type: 'application/pdf' }),
      filename,
      photoWarning: error?.message || 'Lampiran foto tidak dapat dimuat di pratinjau PDF.',
    };
  }
}

const exporters = createDocumentExporters(buildNooDocumentBlueprint);
export const exportNooDocx = exporters.exportDocx;
export const exportNooExcel = exporters.exportExcel;
export const exportNooCsv = exporters.exportCsv;
export const exportNooTxt = exporters.exportTxt;
export const exportNooPdf = exporters.exportPdf;
export const exportNooDocument = exporters.createBoundExporters;
