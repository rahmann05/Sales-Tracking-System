# Seed demo operasional

Jalankan dari folder `server` dengan database PostgreSQL lokal yang telah memiliki seluruh migration terbaru:

```powershell
npm run prisma:seed
npm run verify:seed
```

Seed memakai transaksi, ID stabil dan upsert tanpa penimpaan. Tidak ada penghapusan stop PJP, reset database, pengubahan sandi akun lama, harga katalog lama, keputusan approval, atau konfigurasi admin yang sudah tersimpan. Referensi primary cluster akun bawaan yang menunjuk kluster terhapus diperbaiki ke wilayah demo aktif; PJP hari ini yang benar-benar kosong diisi stop berstatus belum dikunjungi. Konfigurasi yang belum tersedia diisi dari `shared/config.mjs`; template role bawaan yang belum tersedia ditambahkan. Akun sales bawaan seed lama yang belum memiliki supervisor dihubungkan ke supervisor bawaan yang masih aktif; keanggotaan yang sudah ditetapkan tidak ditransfer.

Data demo dibatasi pada database localhost/127.0.0.1/::1. Nama pengguna, outlet, SKU, dokumen dan armada contoh ditandai Demo/DEMO. Lokasi dan status pemeriksaan adalah simulasi, tidak mengklaim verifikasi fisik maupun hasil Google. Tidak membuat foto absensi palsu.

## Akun

Sandi awal akun demo baru: `DemoSinar2026!`. Gunakan `SEED_PASSWORD` sebelum penciptaan akun jika membutuhkan sandi awal lain. Seed ulang mempertahankan sandi yang sudah tersimpan.

| Role | Email |
|---|---|
| Admin | admin.demo@sinaranugrah.test |
| Supervisor barat | spv-1.demo@sinaranugrah.test |
| Supervisor timur | spv-2.demo@sinaranugrah.test |
| Sales | sales-1.demo@sinaranugrah.test sampai sales-5.demo@sinaranugrah.test |
| Kepala gudang | gudang.demo@sinaranugrah.test |
| Supir | supir-1.demo@sinaranugrah.test dan supir-2.demo@sinaranugrah.test |

## Cakupan

- Dua supervisor dengan lima sales, lima wilayah awal dan 50 outlet awal, ditambah outlet kunjungan tambahan di luar rencana. Setiap sales mempunyai primary cluster serta 12 template PJP (enam hari × dua siklus minggu).
- PJP tanggal seed dan riwayat 14 hari untuk laporan harian/mingguan/MTD. Contoh stop selesai, sedang dikunjungi, belum masuk, toko tutup dan skip beserta IN/OUT, durasi, order approved/pending/rejected, hasil manual pending/approved, dan insiden.
- Kunjungan luar PJP pending/approved/rejected serta permohonan pengecualian absensi pending/approved dengan masa berlaku/rejected.
- Shift untuk semua role; audit supervisor, tindak lanjut terbuka/selesai, riwayat tindakan dan notifikasi.
- Registrasi outlet draft/submitted/SPV-approved/registered/rejected; master divisi, katalog enam produk; contoh outlet terkunci dan status pemeriksaan koordinat.
- Delapan packing list: draft manual, referensi order approved, antrean gudang, pembagian dua mobil, alokasi satu mobil, pengiriman selesai, retur diterima, dan retur menunggu penerimaan. Dua supir, tiga mobil, serta catatan servis.
- Enam rute pengiriman dengan status draft/ready/in-transit/completed/partial, barang dan karton yang dialokasikan, absensi supir dan bukti hasil berupa catatan demo. Rute terminal berada pada hari sebelumnya, draft satu mobil pada hari berikutnya. Odometer master merupakan snapshot yang sudah mencakup perjalanan historis demo.

Alur packing default tetap MANUAL: admin menyusun sendiri, boleh memakai referensi order, lalu melepas ke kepala gudang untuk alokasi kendaraan. Seed tidak menyalakan opsi alternatif atau override order pending. Nilai manual pada absensi menyimpan snapshot REQUIRE_APPROVAL untuk memperlihatkan riwayat kebijakan; konfigurasi aktif tetap mengikuti pilihan admin. Laporan hanya memasukkan order approved dan hasil manual yang memang sudah disetujui tanpa order tercatat.

Tanggal otomatis mengikuti WIB. Opsional: set `SEED_DATE=YYYY-MM-DD` untuk tanggal tertentu. Data tanggal yang sama tidak digandakan; keputusan, revisi dan perubahan pengguna tetap dipertahankan. Seed untuk tanggal baru menambahkan skenario tanggal baru, bukan mereset skenario lama. Akun demo yang ditransfer tim atau diubah jadwalnya tetap dipertahankan; verifikasi cakupan awal dapat gagal jika data demo sengaja diubah pengguna.

## Verifikasi

`verify:seed` menjalankan seed dua kali, membandingkan seluruh tabel termasuk timestamp dan riwayat, serta memeriksa data sebelumnya tetap utuh (penambahan role bawaan dan perbaikan keanggotaan seed lama dikecualikan secara terbatas). Pemeriksaan mencakup nilai laporan approved-only, jumlah template, alokasi ke dua mobil, kesesuaian outlet referensi order dan saldo barang/karton retur.

Modul seed dipisah menjadi master/configuration, sales, staff dan warehouse di `server/prisma/seeds`; `server/prisma/seed.js` hanya mengoordinasikan transaksi.

## Perluasan pengujian tim dan halaman operasional

- Akun supervisor bawaan `spv@sinaranugrah.com` (Ahmad) tetap menggunakan sandi yang sudah ada. Tim ini mendapat dua anggota demo tambahan GT dan MT dengan wilayah terpisah, kunjungan, order, persetujuan dan audit. Lima sales bawaan diberi template yang belum tersedia berdasarkan wilayah aktifnya; primary cluster terhapus mendapat wilayah demo pengganti.
- Supervisor demo timur mendapat satu sales Modern Trade. Semua kluster demo hanya berisi satu jenis perdagangan. Outlet tambahan untuk kunjungan luar PJP tidak termasuk sepuluh stop terencana.
- Riwayat 14 hari mencakup order disetujui/menunggu/ditolak, hasil manual, kunjungan singkat dan penyimpangan lokasi simulasi. Template awal mengikuti siklus minggu aktif; template umum ditampilkan sebagai pilihan tersendiri.
- Akun kepala gudang dan supir bawaan juga mendapat shift dan rute demo, selain akun demo khusus. Armada tambahan mencegah pemakaian kendaraan demo yang sama antarkelompok supir. Setiap supir mempunyai rute tanggal seed yang dapat dibaca melalui API.
- GPS live memerlukan kiriman lokasi dari perangkat. Seed tidak mengaku sebagai lokasi live atau menyediakan foto bukti fisik palsu.
- Menu Tim mengelola anggota dan penugasan; Master RJP memuat tab Wilayah, Template, dan PJP harian. Pengelolaan kluster berada dalam tab Wilayah, tanpa menu samping duplikat.

Jalankan `npm run verify:workspace-data` setelah seed untuk memeriksa API HTTP beserta middleware: respons tim tidak menggantung, pembatasan role, cakupan supervisor, template terisi, Daily Call dari PostgreSQL dan rute setiap supir. `npm run verify:seed` tetap memeriksa dua eksekusi identik dan menjaga data pengguna yang sudah ada, dengan pengecualian terbatas untuk pemulihan referensi seed lama dan sinkronisasi hitungan outlet demo.
