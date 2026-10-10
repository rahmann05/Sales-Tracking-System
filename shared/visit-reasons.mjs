export const DEFAULT_EARLY_REASONS=[
 'Pemilik Toko Sedang Terburu-buru / Sibuk',
 'Toko Tutup / Sedang Istirahat Siang',
 'Hanya Mengantar Nota / Tagihan Pembayaran',
 'Pelanggan belum membutuhkan order',
 'Kendala Teknis / Darurat Lapangan Lainnya',
].join('\n');
export function parseReasonOptions(value){
 if(typeof value!=='string'||value.length>2000)throw new Error('Daftar alasan harus teks maksimal 2.000 karakter.');
 const items=value.split(/\r?\n/).map(item=>item.trim()).filter(Boolean);
 if(!items.length||items.length>30||items.some(item=>item.length>200))throw new Error('Isi 1–30 alasan, satu per baris, maksimal 200 karakter per alasan.');
 if(new Set(items.map(item=>item.toLocaleLowerCase('id'))).size!==items.length)throw new Error('Alasan tidak boleh berulang.');
 return items;
}
export function earlyReasonError(reason,values){
 const text=typeof reason==='string'?reason.trim():'';
 if(!text)return 'Alasan checkout lebih awal wajib diisi.';
 if(text.length>1000)return 'Alasan checkout maksimal 1.000 karakter.';
 if(values.ATTENDANCE_EARLY_ALLOW_CUSTOM_REASON===false&&!parseReasonOptions(values.ATTENDANCE_EARLY_REASON_OPTIONS??DEFAULT_EARLY_REASONS).includes(text))return 'Pilih alasan checkout yang tersedia pada aturan kunjungan ini.';
 return null;
}
