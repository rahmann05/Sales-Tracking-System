import { downloadBlob } from "./helpers";
export const exportCustomerSummaryTxt = (data = [], filename = 'RINGKASAN_REGISTRASI_OUTLET.txt') => {
  if (!data || data.length === 0) {
    alert('Tidak ada data registrasi customer untuk diekspor.');
    return;
  }
  let txt = `========================================================================================\n`;
  txt += `CV. SINAR ANUGRAH FMCG DISTRIBUTOR - LAPORAN REGISTRASI OUTLET BARU\n`;
  txt += `Tanggal Cetak: ${new Date().toLocaleString('id-ID')}\n`;
  txt += `Total Record: ${data.length} Outlet\n`;
  txt += `========================================================================================\n\n`;
  data.forEach((d, idx) => {
    txt += `[#${idx + 1}] KODE: ${d.customerCode || 'MENUNGGU FINALISASI'} | STATUS: ${d.registrationStatus}\n`;
    txt += `  Nama Toko    : ${d.name} (${d.division || 'BELFOODS'})\n`;
    txt += `  Nama Pemilik : ${d.ownerName || '-'}\n`;
    txt += `  Alamat       : ${d.address}, ${d.subAreaKecamatan || ''}, ${d.area || 'CMH'}\n`;
    txt += `  No. Telepon  : ${d.phone || '-'}\n`;
    txt += `  Saluran      : ${d.channel} / ${d.subChannel} (Tier: ${d.channelTier || 'A'})\n`;
    txt += `  Pajak (Tax)  : ${d.taxType} (No: ${d.taxNumber || '-'})\n`;
    txt += `  Pembayaran   : ${d.paymentType} ${d.termOfPaymentDays ? `(${d.termOfPaymentDays} Hari)` : ''}\n`;
    txt += `  Jadwal RJP   : ${d.visitWeekSchedule} (Hari: ${d.visitDays || '-'})\n`;
    txt += `  Salesman     : ${d.salesmanName || '-'} | SPV: ${d.spvName || '-'}\n`;
    txt += `  Koordinat    : Lat ${d.latitude}, Lng ${d.longitude}\n`;
    txt += `----------------------------------------------------------------------------------------\n`;
  });
  downloadBlob(txt, filename, 'text/plain;charset=utf-8;');
};
