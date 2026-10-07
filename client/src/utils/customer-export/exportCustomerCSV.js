import { downloadBlob } from "./helpers";
export const exportCustomerCSV = (data = [], filename = 'DATA_CUSTOMER_REGISTRASI.csv') => {
  if (!data || data.length === 0) {
    alert('Tidak ada data registrasi customer untuk diekspor.');
    return;
  }
  const headers = ['No', 'Kode Customer', 'Nama Outlet', 'Nama Pemilik', 'Alamat Lengkap', 'Kota', 'Kecamatan', 'No Telepon', 'Divisi', 'Area', 'Channel', 'Sub Channel', 'Tier', 'Tipe Pajak', 'NPWP / NIK', 'Nama Pajak', 'Alamat Pajak', 'Tipe Bayar', 'TOP (Hari)', 'Jadwal RJP', 'Hari Kunjungan', 'Salesman', 'Supervisor', 'Status', 'Tanggal Pengajuan', 'Latitude', 'Longitude'];
  const rows = data.map((d, idx) => [idx + 1, `"${d.customerCode || '-'}"`, `"${(d.name || '').replace(/"/g, '""')}"`, `"${(d.ownerName || '').replace(/"/g, '""')}"`, `"${(d.address || '').replace(/"/g, '""')}"`, `"${d.city || 'CIMAHI'}"`, `"${(d.subAreaKecamatan || '').replace(/"/g, '""')}"`, `"${d.phone || '-'}"`, `"${d.division || 'BELFOODS'}"`, `"${d.area || 'CMH'}"`, `"${d.channel || 'GT'}"`, `"${d.subChannel || 'RTL'}"`, `"${d.channelTier || 'A'}"`, `"${d.taxType || 'NON_PKP'}"`, `"${d.taxNumber || '-'}"`, `"${(d.taxName || d.ownerName || '').replace(/"/g, '""')}"`, `"${(d.taxAddress || d.address || '').replace(/"/g, '""')}"`, `"${d.paymentType || 'CASH'}"`, d.termOfPaymentDays || 0, `"${d.visitWeekSchedule || 'EVERY_WEEK'}"`, `"${d.visitDays || '-'}"`, `"${(d.salesmanName || '').replace(/"/g, '""')}"`, `"${(d.spvName || '').replace(/"/g, '""')}"`, `"${d.registrationStatus || '-'}"`, d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '-', d.latitude || 0, d.longitude || 0]);
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
};
