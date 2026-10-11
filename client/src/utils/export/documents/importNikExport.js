import { createDocumentExporters } from '../core/createDocumentExporters';
import { formatDateId, safeStr } from '../core/formatters';

function buildImportNikBlueprint(items = [], customFilename) {
  const list = Array.isArray(items) ? items : [];
  const dateCode = new Date().toISOString().split('T')[0];

  const rows = list.map((d) => {
    const custCode = safeStr(d.customerCode || d.outletCode, 'CMH00000');
    const custName = safeStr(d.name || d.customerName, '').toUpperCase();
    const rawNik = String(d.taxNumber || d.nik || '').replace(/[^0-9]/g, '');
    const nik = rawNik.length >= 10 ? rawNik : '3200000000000000';
    const ownerName = safeStr(d.taxName || d.ownerName || custName, '').toUpperCase();
    const address = `${safeStr(d.taxAddress || d.address, '').toUpperCase()}~`;
    const isPkp = d.taxType === 'PKP' ? 'Y' : 'N';
    const npwp =
      d.taxType === 'PKP' && d.taxNumber && String(d.taxNumber).includes('.')
        ? d.taxNumber
        : '00.000.000.0-000.000';
    return [custCode, custName, nik, ownerName, address, isPkp, npwp];
  });

  const validNikCount = list.filter((d) => {
    const raw = String(d.taxNumber || d.nik || '').replace(/[^0-9]/g, '');
    return raw.length === 16;
  }).length;

  return {
    domain: 'OUTLET',
    filename: `IMPORT_NIK_${dateCode}`,
    customFilename,
    sheetName: 'Sheet1',
    rawSheetOnly: true,
    orientation: 'landscape',
    title: 'DOKUMEN RESMI IMPORT NIK & IDENTITAS PAJAK PELANGGAN',
    subtitle: 'Format Standar 7 Kolom Verifikasi NIK 16-Digit & NPWP Pelanggan',
    docNumber: `NIK-${dateCode.replace(/-/g, '')}`,
    metaItems: [
      { label: 'Tanggal Cetak', value: formatDateId(new Date()) },
      { label: 'Total Pelanggan', value: `${list.length} Outlet` },
      { label: 'NIK 16-Digit Lengkap', value: `${validNikCount} Outlet` },
      { label: 'Belum Lengkap', value: `${Math.max(0, list.length - validNikCount)} Outlet` },
    ],
    sections: [
      {
        title: 'Daftar Identitas Pajak & NIK 16-Digit Pelanggan',
        headers: [
          'Kode Customer',
          'Nama Customer',
          'NIK (16 Digit)',
          'Nama Pemilik / Wajib Pajak',
          'Alamat Pajak (~)',
          'Status PKP',
          'Nomor NPWP',
        ],
        rows,
        columnWidths: [13, 18, 16, 16, 22, 6, 9],
        centerAlignCols: [5],
      },
    ],
    notes: [
      'Format 7 kolom mengikuti spesifikasi resmi IMPORT NIK untuk sinkronisasi administrasi perpajakan dan ERP.',
    ],
    signatories: [
      { role: 'Diverifikasi Oleh,', name: 'Admin Master Data', title: 'Administrasi Pelanggan' },
      { role: 'Disetujui Oleh,', name: 'Supervisor / Manajer', title: 'Otorisasi Perpajakan' },
    ],
  };
}

const exporters = createDocumentExporters(buildImportNikBlueprint);
export const exportImportNikDocx = exporters.exportDocx;
export const exportImportNikXlsx = exporters.exportExcel;
export const exportImportNikCsv = exporters.exportCsv;
export const exportImportNikTxt = exporters.exportTxt;
export const exportImportNikPdf = exporters.exportPdf;
export const exportImportNik = exporters.createBoundExporters;
