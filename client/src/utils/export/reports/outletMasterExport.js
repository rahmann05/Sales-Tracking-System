import { createDocumentExporters } from '../core/createDocumentExporters';
import { formatDateId, formatNumber, safeStr } from '../core/formatters';
import { supervisorSignatories } from '../core/documentIdentity';

const MASTER_HEADERS = [
  'No',
  'No. Reg',
  'Kode Outlet',
  'Nama Toko',
  'Nama Pemilik',
  'Alamat',
  'Kecamatan',
  'Kota',
  'Telepon',
  'Divisi',
  'Area',
  'Channel',
  'Sub Channel',
  'Tier',
  'Pajak',
  'NPWP / NIK',
  'Tipe Bayar',
  'TOP (Hr)',
  'Jadwal RJP',
  'Hari Kunjungan',
  'Salesman',
  'Supervisor',
  'Status',
  'Tgl Pengajuan',
  'Koordinat GPS',
];

// Kolom kode (channel, tier, pajak, jadwal, status) dibaca manusia di dokumen cetak.
const HUMAN_COLUMNS = [11, 12, 13, 14, 16, 18, 22];
const humanize = (row) =>
  row.map((cell, index) =>
    HUMAN_COLUMNS.includes(index) ? String(cell).replace(/_/g, ' ') : cell
  );

/**
 * Tabel data penuh memiliki 25 kolom: Excel dan CSV memakainya apa adanya. Di kertas (PDF, Word,
 * TXT) 25 kolom tidak muat terbaca, jadi dipecah menjadi tiga tabel bertema yang mengulang
 * No dan Nama Toko sebagai penanda baris.
 */
function buildPaperSections(headers, rows) {
  const pick = (title, columns, columnWidths, extra = {}) => ({
    title,
    headers: columns.map((index) => headers[index]),
    rows: rows.map((row) => columns.map((index) => row[index])),
    columnWidths,
    ...extra,
  });
  return [
    pick('A. Identitas & Alamat Outlet', [0, 1, 2, 3, 4, 5, 6, 7, 8], [4, 12, 10, 17, 14, 27, 11, 10, 12]),
    pick(
      'B. Klasifikasi, Pajak & Pembayaran',
      [0, 3, 9, 10, 11, 12, 13, 14, 15, 16, 17],
      [4, 17, 9, 10, 11, 12, 8, 8, 15, 8, 6],
      { rightAlignCols: [10] }
    ),
    pick(
      'C. Jadwal Kunjungan & Status Pengajuan',
      [0, 3, 18, 19, 20, 21, 22, 23, 24],
      [4, 17, 11, 14, 12, 12, 9, 10, 17]
    ),
  ];
}

export function buildOutletMasterBlueprint(items = [], customFilename) {
  const list = Array.isArray(items) ? items : [];
  const dateCode = new Date().toISOString().split('T')[0];

  const approvedCount = list.filter((d) =>
    ['APPROVED', 'FINALIZED', 'ACTIVE'].includes(
      String(d.registrationStatus || d.status || '').toUpperCase()
    )
  ).length;
  const pendingCount = list.filter((d) =>
    ['PENDING', 'SUBMITTED', 'VERIFIED'].includes(
      String(d.registrationStatus || d.status || '').toUpperCase()
    )
  ).length;
  const rejectedCount = list.filter(
    (d) => String(d.registrationStatus || d.status || '').toUpperCase() === 'REJECTED'
  ).length;

  const rows = list.map((d, idx) => [
    idx + 1,
    safeStr(
      d.registrationCode || (d.id ? `REG-${String(d.id).substring(0, 6).toUpperCase()}` : '-')
    ),
    safeStr(d.customerCode || d.outletCode, '-'),
    safeStr(d.name || d.outletName, '-'),
    safeStr(d.ownerName, '-'),
    safeStr(d.address, '-'),
    safeStr(d.subAreaKecamatan, '-'),
    safeStr(d.city, 'Belum diisi'),
    safeStr(d.phone, '-'),
    safeStr(d.division, 'Belum diisi'),
    safeStr(d.area, 'Belum diisi'),
    safeStr(d.channel, 'Belum diisi'),
    safeStr(d.subChannel, 'Belum diisi'),
    safeStr(d.channelTier, 'Belum diisi'),
    safeStr(d.taxType, 'Belum diisi'),
    safeStr(d.taxNumber || d.nik, '-'),
    safeStr(d.paymentType, 'Belum diisi'),
    formatNumber(d.termOfPaymentDays || 0),
    safeStr(d.visitWeekSchedule, 'Belum diisi'),
    Array.isArray(d.visitDays) ? d.visitDays.join(', ') : safeStr(d.visitDays, '-'),
    safeStr(d.salesmanName, '-'),
    safeStr(d.spvName, '-'),
    safeStr(d.registrationStatus || d.status, 'PENDING'),
    d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '-',
    `${safeStr(d.latitude, 'Belum tersedia')}, ${safeStr(d.longitude, 'Belum tersedia')}`,
  ]);

  return {
    domain: 'OUTLET',
    filename: `Master_Registrasi_Outlet_${dateCode}`,
    customFilename,
    sheetName: 'MASTER_OUTLET',
    orientation: 'landscape',
    title: 'LAPORAN MASTER & REKAPITULASI REGISTRASI OUTLET (NOO)',
    subtitle: 'Data Pelanggan Baru, Klasifikasi Saluran, Identitas Pajak & Jadwal Kunjungan RJP',
    docNumber: `OUTLET-${dateCode.replace(/-/g, '')}`,
    metaItems: [
      { label: 'Tanggal Cetak', value: formatDateId(new Date()) },
      { label: 'Total Data Outlet', value: `${list.length} Outlet` },
      { label: 'Disetujui / Aktif', value: `${approvedCount} Outlet` },
      { label: 'Menunggu Proses', value: `${pendingCount} Outlet` },
      { label: 'Ditolak / Revisi', value: `${rejectedCount} Outlet` },
      { label: 'Standar Master', value: 'ND6 Customer Master' },
    ],
    paperSections: buildPaperSections(MASTER_HEADERS, rows.map(humanize)),
    sections: [
      {
        title: 'Daftar Rekapitulasi Master & Registrasi Outlet',
        headers: MASTER_HEADERS,
        rows,
        rightAlignCols: [17],
      },
    ],
    notes: [
      'Data mencakup atribut lengkap pengajuan pelanggan baru (NOO) untuk kebutuhan verifikasi lapangan dan sinkronisasi ND6.',
    ],
    signatories: supervisorSignatories(),
  };
}

const exporters = createDocumentExporters(buildOutletMasterBlueprint);
export const exportOutletMasterDocx = exporters.exportDocx;
export const exportOutletMasterXlsx = exporters.exportExcel;
export const exportOutletMasterCsv = exporters.exportCsv;
export const exportOutletMasterTxt = exporters.exportTxt;
export const exportOutletMasterPdf = exporters.exportPdf;
export const exportOutletMaster = exporters.createBoundExporters;
