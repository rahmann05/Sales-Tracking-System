# Seed khusus Belfoods

Data master terpilih ditulis langsung di `server/prisma/belfoods/fixtures.js`. Seed berjalan mandiri tanpa membaca JSON, workbook, notebook, atau folder Analisis. `server/prisma/seed.js` merupakan entry point; master, kunjungan dan gudang dipisah dalam modul Belfoods agar mudah diperiksa.

## Menjalankan

Dari folder `server`, setelah seluruh migration diterapkan:

```powershell
# Database kosong atau mengulang seed Belfoods yang sudah ada
npm run prisma:seed

# Reset database lokal: backup otomatis terlebih dahulu
npm run prisma:seed:reset -- --database=sales_tracking_system --reset

# Simulasi reset yang selalu di-rollback
npm run prisma:seed:reset -- --database=sales_tracking_system --dry-run

npm run verify:seed
npm run verify:workspace-data
```

Reset hanya mendukung database lokal bernama `sales_tracking_system`, menolak tabel yang tidak dikenali dan migration belum selesai. Backup PostgreSQL lengkap disimpan di `.backups/belfoods/`; arsip diperiksa dengan `pg_restore --list`. Reset dan pengisian dilakukan dalam satu transaksi, dengan verifikasi sebelum commit. Riwayat migration dipertahankan. Matikan server/scheduler selama reset. Pengembalian backup penuh harus dilakukan terpisah pada database tujuan yang sudah disiapkan.

Seed biasa memakai ID stabil dan upsert tanpa penimpaan data, sandi, konfigurasi, approval atau keputusan pengguna. Tanggal pertama dikunci dalam `BELFOODS_UAT_SEED`. Mengganti tanggal memerlukan reset bercadangan; tidak menambahkan skenario harian tanpa batas. `SEED_DATE=YYYY-MM-DD` dapat dipakai saat penciptaan dataset.

## Akun uji

Sandi awal: `DemoSinar2026!`. `SEED_PASSWORD` dapat menentukan sandi sebelum penciptaan akun. Pengujian login menggunakan sandi yang sama; bila sandi telah diganti pengguna, verifikasi login harus disesuaikan.

| Peran | Email | Penugasan |
|---|---|---|
| Admin | admin.demo@sinaranugrah.test | Seluruh administrasi |
| SPV GT | spv-1.demo@sinaranugrah.test | Cahya dan Dadan |
| SPV MT | spv-2.demo@sinaranugrah.test | Puri, Yati dan Yuli |
| Sales Cahya | sales-1.demo@sinaranugrah.test | SLD514 |
| Sales Dadan | sales-2.demo@sinaranugrah.test | SLD516 |
| Sales Puri | sales-3.demo@sinaranugrah.test | SLD515 |
| Sales Yati | sales-4.demo@sinaranugrah.test | SLD517 |
| Sales Yuli | sales-5.demo@sinaranugrah.test | SLD539 |
| Kepala gudang | gudang.demo@sinaranugrah.test | Packing dan pengiriman |
| Driver | supir-1.demo@sinaranugrah.test | Rute siap berangkat dan riwayat retur |
| Driver | supir-2.demo@sinaranugrah.test | Rute sedang berjalan |

Login ulang setelah reset karena ID akun lama sudah diganti.

## Dataset kecil untuk pengujian

- 20 outlet asli dari tujuh varian callplan Belfoods, empat outlet per sales; lima cluster homogen dan delapan template yang mengikuti hari/varian sumber.
- 10 PJP (hari seed dan satu tanggal historis per sales), 39 stop, 47 absensi, satu kunjungan luar PJP pending. Contoh IN_OUT, IN_ONLY, OPTIONAL, kunjungan aktif/selesai, dan missing check-out berflag SPV.
- Delapan order: lima approved historis, dua pending approval dan satu rejected. Tiga produk, harga dan kuantitas simulasi. Laporan menghitung order approved saja.
- Lima packing list dan lima faktur, tiga rute READY/IN_TRANSIT/PARTIAL, empat tujuan pengiriman, tiga armada dan satu catatan servis. Retur pending ditampilkan sebagai masalah gudang; jumlah barang, karton dan faktur konsisten.
- Empat registrasi DRAFT/SUBMITTED/SPV_APPROVED/REJECTED, dua pemeriksaan outlet opsional, audit SPV, tindak lanjut kunjungan dan janji pembayaran eksternal, serta notifikasi informatif.
- Seluruh 294 parameter awal aplikasi, definisi role dan metadata seed. Snapshot kebijakan aktivitas uji mencatat simulasi sesuai mode; konfigurasi aktif awal mengikuti default aplikasi.

Identitas, alamat dan koordinat outlet mengikuti sumber lama. Seluruh outlet tetap UNVALIDATED; confidence lama disimpan sebagai metadata, bukan bukti verifikasi aplikasi. Channel, cluster, interval dan tanggal acuan planner merupakan pilihan skenario uji yang perlu disesuaikan admin sebelum penggunaan operasional. F1/F2/F4 berarti interval satu/dua/empat minggu.

Sumber tidak memuat transaksi, katalog, harga, kontak atau tanggal kunjungan aktual. Aktivitas, nominal, produk, armada dan tanggal ditandai Uji Belfoods/BELFOODS_UAT_SIMULATION. GPS live dan foto perangkat hanya tersedia setelah pengiriman bukti dari perangkat nyata. Pembayaran berlangsung di luar aplikasi; field stok katalog bernilai nol sesuai batasan aplikasi.

## Hasil pelaksanaan 9 Oktober 2026

Reset lokal selesai. Backup: `.backups/belfoods/sales_tracking_system-2026-10-09T12-48-47-990Z.dump` beserta metadata checksum dan hitungan tabel. Dry-run berhasil dan membuktikan database lama utuh. Dua eksekusi ulang seed identik pada seluruh tabel. Verifikasi konsistensi seed dan API cakupan tim, template, laporan serta rute driver lulus.

Audit sumber lengkap tersedia pada `BELFOODS_AUDIT.md` dan inventaris hash `server/prisma/belfoods/source-audit.json`. JSON audit hanya laporan, tidak dibaca oleh seed.
