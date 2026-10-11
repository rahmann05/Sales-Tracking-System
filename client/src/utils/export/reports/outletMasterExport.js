import { createDocumentExporters } from '../core/createDocumentExporters';
import { formatDateId, formatNumber, safeStr } from '../core/formatters';

function buildOutletMasterBlueprint(items = [], customFilename) {
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
    sections: [
      {
        title: 'Daftar Rekapitulasi Master & Registrasi Outlet',
        headers: [
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
        ],
        rows,
        rightAlignCols: [17],
      },
    ],
    notes: [
      'Data mencakup atribut lengkap pengajuan pelanggan baru (NOO) untuk kebutuhan verifikasi lapangan dan sinkronisasi ND6.',
    ],
    signatories: [
      { role: 'Disiapkan Oleh,', name: 'Admin Master Data', title: 'Pengelola Data Pelanggan' },
      { role: 'Diperiksa Oleh,', name: 'Supervisor Area', title: 'Koordinator Lapangan' },
      { role: 'Disetujui Oleh,', name: 'Manajer Operasional', title: 'Pimpinan Distribusi' },
    ],
  };
}

const exporters = createDocumentExporters(buildOutletMasterBlueprint);
export const exportOutletMasterDocx = exporters.exportDocx;
export const exportOutletMasterXlsx = exporters.exportExcel;
export const exportOutletMasterCsv = exporters.exportCsv;
export const exportOutletMasterTxt = exporters.exportTxt;
export const exportOutletMasterPdf = exporters.exportPdf;
export const exportOutletMaster = exporters.createBoundExporters;
