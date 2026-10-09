import React from 'react';

export function PolicyConfigurationScope(){
 return <details className="policy-panel policy-scope-note">
  <summary>Cakupan pengaturan dan batas alur</summary>
  <div className="policy-panel-body">
   <div><h3>Aturan yang tersedia</h3><p>Mode fitur, presensi, bukti, persetujuan, kalender PJP, tahapan gudang, pelacakan, dan keluaran laporan diatur di sini. Target, akun, penugasan, produk, dan kendaraan memakai editor khusus di atas.</p></div>
   <div><h3>Integritas yang selalu berlaku</h3><p>Hak akses sesuai penugasan, nomor unik, jumlah barang yang sah, dan riwayat bukti tetap diperiksa. Mematikan tahap tidak membuat bukti pemeriksaan atau presensi otomatis. Stok tidak dikelola dan pembayaran dilakukan di luar aplikasi.</p></div>
   <div><h3>Pilihan alur lanjutan yang belum tersedia</h3><p>Delegasi pemeriksa dengan tanggal berlaku, persetujuan bersyarat nominal, order di luar konteks PJP, manifest tanpa packing, dan penerimaan transaksi bertanggal mundur belum menjadi pilihan pengaturan. Mengubah sakelar fitur tidak membuka alur tersebut.</p></div>
   <div><h3>Data historis</h3><p>Parameter stok, target umum lama, skor confidence outlet, dan legenda lama sudah dikeluarkan dari editor. Nilai lama tetap disimpan untuk kompatibilitas; tidak mengatur operasi baru.</p></div>
  </div>
 </details>;
}
