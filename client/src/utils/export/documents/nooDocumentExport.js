import { createDocumentExporters } from '../core/createDocumentExporters';
import { formatCurrency, formatDateId, safeStr } from '../core/formatters';

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
      { label: 'Divisi Distribusi', value: safeStr(item.divisionName || item.division, 'Belum diisi') },
      { label: 'Wilayah / Area', value: safeStr(item.area, 'Belum diisi') },
    ],
    sections: [
      {
        title: '1. Identitas Toko / Outlet',
        headers: ['No', 'Atribut Identitas Outlet', 'Nilai / Keterangan Tercatat'],
        rows: [
          ['1', 'Nama Toko / Outlet', safeStr(item.name || item.outletName)],
          ['2', 'Nama Pemilik (Owner)', safeStr(item.ownerName)],
          ['3', 'Nomor Telepon / WhatsApp', safeStr(item.phone || item.ownerPhone)],
          ['4', 'Alamat Lengkap Toko', [item.address,item.address2,item.address3].filter(Boolean).join(', ') || 'Belum diisi'],
          [
            '5',
            'Kecamatan / Kota',
            `${safeStr(item.subAreaKecamatan)} / ${safeStr(item.city, 'Belum diisi')}`,
          ],
          ['6', 'Kode Pos', safeStr(item.postalCode, '-')],
          [
            '7',
            'Titik Koordinat GPS',
            `Lat: ${safeStr(item.latitude, 'Belum tersedia')}, Lng: ${safeStr(item.longitude, 'Belum tersedia')}`,
          ],
          [
            '8',
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
            `${safeStr(item.channel, 'Belum diisi')} / ${safeStr(item.subChannel, 'Belum diisi')}`,
          ],
          ['2', 'Kelas / Tiering Outlet', `Tier ${safeStr(item.channelTier, 'Belum diisi')}`],
          ['3', 'Status Perpajakan', safeStr(item.taxType, 'Belum diisi')],
          ['4', 'Nomor NPWP / NIK 16-Digit', safeStr(item.taxNumber || item.nik, '-')],
          ['5', 'Nama Wajib Pajak (Sesuai KTP/NPWP)', safeStr(item.taxName || item.ownerName)],
          ['6', 'Alamat Pajak', safeStr(item.taxAddress || item.address)],
          ['7', 'Metode Pembayaran', safeStr(item.paymentType, 'Belum diisi')],
          ['8', 'Term of Payment (TOP)', item.termOfPaymentDays == null ? 'Belum diisi' : `${Number(item.termOfPaymentDays)} Hari`],
          ['9', 'Plafon / Limit Kredit', item.creditLimit == null ? 'Belum diisi' : formatCurrency(item.creditLimit)],
        ],
        columnWidths: [8, 35, 57],
      },
      {
        title: '3. Jadwal Kunjungan Rutin (RJP / PJP) & Verifikasi',
        headers: ['No', 'Atribut Rute & Otorisasi', 'Nilai / Keterangan Tercatat'],
        rows: [
          ['1', 'Siklus Kunjungan RJP', item.visitIntervalWeeks ? `Setiap ${item.visitIntervalWeeks} minggu` : safeStr(item.visitWeekSchedule, 'Belum diisi')],
          ['2', 'Hari Kunjungan Rutin', visitDays],
          ['3', 'Salesman Pengaju', safeStr(item.salesmanName || item.submittedBy?.name)],
          ['4', 'Supervisor Area', safeStr(item.spvName || item.supervisorName)],
          ['5', 'Catatan Verifikasi / Penolakan', safeStr(item.rejectionNote, 'Tidak ada catatan keputusan')],
        ],
        columnWidths: [8, 35, 57],
      },
    ],
    images: item.photoUrl ? [{url: item.photoUrl, caption: `Foto outlet ${safeStr(item.name)}`}] : [],
    notes: [
      ...(!item.photoUrl ? ['Foto fisik outlet belum dilampirkan.'] : []),
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
        name: 'Admin Master Data',
        title: 'Otorisasi Sistem ND6',
      },
    ],
  };
}

const exporters = createDocumentExporters(buildNooDocumentBlueprint);
export const exportNooDocx = exporters.exportDocx;
export const exportNooExcel = exporters.exportExcel;
export const exportNooCsv = exporters.exportCsv;
export const exportNooTxt = exporters.exportTxt;
export const exportNooPdf = exporters.exportPdf;
export const exportNooDocument = exporters.createBoundExporters;
