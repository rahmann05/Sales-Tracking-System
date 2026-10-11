import { createDocumentExporters } from '../core/createDocumentExporters';
import { formatCurrency, formatDateId, safeStr } from '../core/formatters';

function buildNooDocumentBlueprint(item = {}) {
  const regNo = safeStr(
    item.registrationCode ||
      (item.id ? `REG-${String(item.id).substring(0, 8).toUpperCase()}` : 'REG-BARU')
  );
  const custCode = safeStr(item.customerCode || item.outletCode, 'MENUNGGU FINALISASI');
  const status = safeStr(item.registrationStatus || item.status, 'PENDING');
  const dateStr = formatDateId(item.createdAt || new Date());
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
      { label: 'Divisi Distribusi', value: safeStr(item.division, 'BELFOODS') },
      { label: 'Wilayah / Area', value: safeStr(item.area, 'CMH') },
    ],
    sections: [
      {
        title: '1. Identitas Toko / Outlet',
        headers: ['No', 'Atribut Identitas Outlet', 'Nilai / Keterangan Tercatat'],
        rows: [
          ['1', 'Nama Toko / Outlet', safeStr(item.name || item.outletName)],
          ['2', 'Nama Pemilik (Owner)', safeStr(item.ownerName)],
          ['3', 'Nomor Telepon / WhatsApp', safeStr(item.phone || item.ownerPhone)],
          ['4', 'Alamat Lengkap Toko', safeStr(item.address)],
          [
            '5',
            'Kecamatan / Kota',
            `${safeStr(item.subAreaKecamatan)} / ${safeStr(item.city, 'CIMAHI')}`,
          ],
          ['6', 'Kode Pos', safeStr(item.postalCode, '-')],
          [
            '7',
            'Titik Koordinat GPS',
            `Lat: ${safeStr(item.latitude, '0')}, Lng: ${safeStr(item.longitude, '0')}`,
          ],
          [
            '8',
            'ID Bukti Foto Lapangan',
            safeStr(item.photoId, item.photoUrl ? 'PHOTO-REG-LIVE' : '-'),
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
            `${safeStr(item.channel, 'GT')} / ${safeStr(item.subChannel, 'RTL')}`,
          ],
          ['2', 'Kelas / Tiering Outlet', `Tier ${safeStr(item.channelTier, 'A')}`],
          ['3', 'Status Perpajakan', safeStr(item.taxType, 'NON_PKP')],
          ['4', 'Nomor NPWP / NIK 16-Digit', safeStr(item.taxNumber || item.nik, '-')],
          ['5', 'Nama Wajib Pajak (Sesuai KTP/NPWP)', safeStr(item.taxName || item.ownerName)],
          ['6', 'Alamat Pajak', safeStr(item.taxAddress || item.address)],
          ['7', 'Metode Pembayaran', safeStr(item.paymentType, 'CASH')],
          ['8', 'Term of Payment (TOP)', `${Number(item.termOfPaymentDays || 0)} Hari`],
          ['9', 'Plafon / Limit Kredit', formatCurrency(item.creditLimit || 0)],
        ],
        columnWidths: [8, 35, 57],
      },
      {
        title: '3. Jadwal Kunjungan Rutin (RJP / PJP) & Verifikasi',
        headers: ['No', 'Atribut Rute & Otorisasi', 'Nilai / Keterangan Tercatat'],
        rows: [
          ['1', 'Siklus Kunjungan RJP', safeStr(item.visitWeekSchedule, 'EVERY_WEEK')],
          ['2', 'Hari Kunjungan Rutin', visitDays],
          ['3', 'Salesman Pengaju', safeStr(item.salesmanName || item.submittedBy?.name)],
          ['4', 'Supervisor Area', safeStr(item.spvName || item.supervisorName)],
          ['5', 'Catatan Verifikasi / Penolakan', safeStr(item.rejectionNote, 'Sesuai prosedur')],
        ],
        columnWidths: [8, 35, 57],
      },
    ],
    notes: [
      'Formulir ini merupakan bukti sah registrasi pelanggan baru (NOO) dan dasar pengaktifan Master Customer ND6.',
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
