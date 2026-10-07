# Absensi, PJP, katalog dan pengaturan operasional

Status lokal 7 Oktober 2026. Keputusan bisnis, definisi metrik dan penyelesaian audit seluruh role ada di BUSINESS_PROCESS_REVIEW.md. Detail packing ada di PACKING_WORKFLOW.md.

## Parameter admin dan perilakunya

| Kelompok | Parameter dan default utama |
|---|---|
| Katalog | SALES_ALLOW_PRODUCT_CREATE=false; SALES_ALLOW_PRICE_OVERRIDE=false. Admin mengelola produk/SKU/harga/referensi stok. Sales boleh menambah katalog hanya jika izin input produk aktif. |
| Hasil absen | ATTENDANCE_ALLOW_MANUAL_SALES=true; MANUAL_SALES_REPORT_MODE=NOTES_ONLY. REQUIRE_APPROVAL menyediakan antrean admin/supervisor. Snapshot kebijakan, produk, aktor, waktu, alasan dan status tersimpan. |
| Jadwal | PJP_WORKING_DAYS=1,2,3,4,5,6; PJP_WEEK_MODE=ISO_PARITY; PJP_FALLBACK_TO_CLUSTER=true. Alternatif MONTH_CYCLE tersedia. Template ALL/WEEK_1/WEEK_2 disimpan dengan outlet dan urutan nyata, termasuk template kosong. |
| Presensi | ATTENDANCE_REQUIRE_ACTIVE_SHIFT=false; SHIFT_START_TIME=08:00; radius/durasi minimum configurable; UNLOCK_VALIDITY_MINUTES=120; BYPASS_GEOFENCE_EMAILS default kosong. Persetujuan pengecualian harus aktif dan sesuai pemohon/outlet. |
| Insiden | ALLOW_CONTINUE_PENDING_CLOSED=true; REROUTE_REQUIRE_ADMIN_APPROVAL=false. Skip/reroute dan penolakan merekonsiliasi stop/PJP. |
| Supervisi | SPV_ENFORCE_VISIT_LIMIT=false; limit joint dan audit configurable. Pemilihan toko eksplisit, audit dapat membuat tindak lanjut dengan pemilik/tenggat/catatan. |
| Order | DEFAULT_PAYMENT_TYPE=CASH; DEFAULT_TERM_OF_PAYMENT_DAYS dan TAX_RATE_PERCENT configurable; ORDER_PRICES_INCLUDE_TAX=true. Pajak dan termin disimpan pada order; perubahan pengaturan tidak menghitung ulang order lama. |
| Pengiriman | DELIVERY_REQUIRE_PHOTO=true; DELIVERY_REQUIRE_GEOFENCE=false; DELIVERY_ALLOW_REDELIVERY=true. Retur perlu dikonfirmasi gudang sebelum pengiriman ulang. |
| Peta | MAPS_BROWSER_API_KEY untuk peta browser; MAPS_API_KEY untuk server. Keduanya default kosong. Kunci server tidak dikirim pada runtime settings. Browser juga mendukung VITE_GOOGLE_MAPS_API_KEY dan fallback peta alternatif. |
| Lainnya | Target laporan, lokasi kantor/gudang, radius validasi, confidence, live tracking, biaya BBM/drop/margin, konfigurasi UI terkait tersedia menurut shared/config.mjs. Nilai nol/false tidak diganti default. |

Definisi tunggal mencakup default, batas input, pilihan dan metadata form pada shared/config.mjs. Server memvalidasi batas dan hubungan antarparameter. API memeriksa kebijakan saat tindakan diterima; settings sesi dimuat ulang saat fokus dan tiap 60 detik. Nilai baru berlaku pada tindakan selanjutnya, tidak menulis ulang histori/approval.

## Transaksi dan akses

IN/OUT sales, shift dan kunjungan supervisor menggunakan lock transaksi per pengguna; database memiliki unique key untuk absensi stop/pengguna/jenis. Packing, alokasi dan hasil pengiriman memakai transaksi serta perubahan status bersyarat. Tidak ada endpoint status PJP langsung yang dapat membuat kunjungan selesai tanpa proses absensi.

Autentikasi memuat akun aktif serta template/override izin terkini, bukan role lama pada JWT. Role kustom menyimpan roleCode dan baseRole. Scope tim diterapkan pada data, approval, penugasan dan notifikasi terkait. Socket memakai token autentikasi dan ruang pengguna privat. Konfigurasi sistem, role dan mutasi akun dibatasi ADMIN.

## Database lokal

Migrasi additive berikut telah diterapkan satu kali pada database lokal yang dikonfigurasi:

1. 202610060001_operational_attendance
2. 202610060002_off_pjp_sales
3. 202610060003_packing_workflow
4. 202610070001_manual_sales_review
5. 202610070002_operational_workflows
6. 202610070003_attendance_idempotency

SQL berada di server/prisma/migrations/*/migration.sql. Prisma Client telah digenerate dan skema divalidasi. Proyek lama memakai db push tanpa baseline Prisma Migrate; SQL diterapkan memakai prisma db execute. Jangan menjalankan kembali SQL pada database yang sudah diperbarui. Untuk lingkungan lain, rekonsiliasi skema/riwayat terlebih dahulu dan terapkan hanya migrasi yang belum ada melalui prosedur deployment lingkungan tersebut.

## Verifikasi melalui script

Dari root: npm --prefix server test, npm --prefix server run verify:source, npm --prefix server run verify:operational, npm --prefix server run verify:packing, npm --prefix server run verify:manual-sales, serta npm --prefix client run build. Script integrasi dibatasi database localhost dan membersihkan fixture. Dependency server dan client diperlukan untuk pemeriksaan parser source.

Hasil akhir: 71 tes, 85 assertion operasional, 26 packing, 14 manual-sales lulus; 521 modul source valid; build 388 modul dengan chunk utama sekitar 221 KB. Pemeriksaan tidak memakai browser. Tidak ada deployment/commit otomatis.

## Penyempurnaan tim, outlet, dan web native
Migrasi `202610070004_sales_team` menambah relasi supervisor sales dan indeks. Jalankan migrasi ini sekali pada database tujuan sebelum server versi ini. Sudah diterapkan pada database lokal localhost; belum deploy ke lingkungan lain.

Service tim dan scope dipisahkan dari assignment wilayah. Form/dialog tim, jadwal, keputusan supervisor, dan koreksi outlet menggunakan komponen `NativeDialog`; detail outlet dipisah dari daftar/filter. Komponen/CSS lama yang tak lagi digunakan dihapus dan diverifikasi keterjangkauannya.

Verifikasi tambahan: `npm run verify:team-outlet` (fixture lokal, provider peta dimock). Script menguji klaim berdasarkan parameter, transfer tim, persaingan revisi, validasi wilayah/template, PJP historis, audit alasan, koreksi GPS, kegagalan provider, kandidat kedaluwarsa, dan perubahan outlet saat validasi.

Verifikasi UI dilakukan dari kode, parser, CSS compilation, dan build sesuai permintaan; tidak ada pemeriksaan tampilan browser. Layanan Google sungguhan tidak dipanggil oleh pengujian tambahan.

Hasil akhir verifikasi tahap ini: 71 tes unit server, 156 pemeriksaan integrasi (85 operasional + 26 packing + 14 penjualan manual + 31 tim/outlet), render kontrak UI lewat script, 524 modul JS valid dan reachable tanpa import mati, Prisma schema valid, serta build frontend produksi lulus. Bundle utama sekitar 219 KB sebelum gzip; peta Google baru diinisialisasi saat dipakai dan GPS sales menggunakan satu watcher.


## Penyelarasan shell dan seed (7 Oktober 2026)

Pencarian global dan badge peran berulang dihapus. Peran tampil di bawah nama pada profil desktop/mobile; pencarian lokal per modul tetap tersedia. Navigasi admin memakai select native, kartu modul memakai button native, dan label bottom navigation mempunyai nama aksesibel lengkap serta teks singkat. Label hari PJP, nama outlet, alamat, keterangan dan tab tidak lagi dipotong dengan ellipsis. Komponen DayPlanTabs dipisah dari orkestrator SalesFieldView; hook pencarian global dan filter yang tidak terpakai dihapus. Angka contoh pada KPI admin diganti jumlah aktual, termasuk nilai nol.

Styling bersama mempertahankan warna monokrom, dengan border/depth halus, sidebar yang lebih tenang, tipografi konsisten, status semantik berkontras lebih baik dan fokus keyboard yang jelas. Referensi: [Linear design refresh](https://linear.app/now/behind-the-latest-design-refresh) dan [Geist typography](https://vercel.com/geist/typography). Verifikasi memakai script/render kontrak, tanpa inspeksi tampilan browser.

Seed lengkap, lokal dan idempotent dijelaskan dalam [SEEDING.md](SEEDING.md). Verifikasi mencakup seluruh base role, konfigurasi, tim/PJP, laporan, approval, audit, packing, alokasi dan retur; tidak mereset histori atau parameter yang sudah disimpan admin.


## Pemulihan sesi dan laporan (7 Oktober 2026)

Transport HTTP dipisah ke `httpClient.js`. Login menyimpan refresh token, pemulihan akses memakai satu refresh bersama, dan respons sesi lama tidak boleh menghapus sesi atau mengisi data akun baru. Data terlindungi baru dimuat setelah `/auth/me` memvalidasi sesi. Deadline fetch 30 detik mencakup pembacaan body; pagination dibatasi dan mendeteksi halaman berulang. Error laporan ditampilkan dengan tombol coba lagi, dan hasil filter lama diabaikan.

Laporan mingguan dan MTD memuat PJP serta absensi luar PJP secara batch untuk semua sales dalam scope. Pengaturan runtime juga memakai satu query bersama saat cache kosong. Error koneksi database menghasilkan 503, sedangkan token tidak sah tetap 401; gangguan database tidak memaksa logout. Tanggal awal laporan mengikuti WIB.

Marker Google memakai `AdvancedMarkerElement` melalui adapter bersama, dengan cleanup click listener dan dukungan ikon/label serta viewport. Parameter admin `MAPS_MAP_ID` mengatur map ID proyek; nilai kosong memakai `DEMO_MAP_ID` untuk pengembangan. Library marker dimuat bersama SDK.

Verifikasi tambahan: `verify:client-fetch`, `verify:session-reports`, dan `verify:map-markers`. Pengujian HTTP memakai PostgreSQL lokal dan fixture yang dibersihkan. Marker diuji dengan SDK mock; tampilan browser dan layanan Google langsung tidak diperiksa.


## Kelola Master Kluster

Menu pengelolaan membuka daftar dengan pencarian, status muat/gagal, edit penanggung jawab, pengelolaan anggota outlet, serta pembuatan kluster terpisah. Statistik memuat seluruh halaman outlet. Form pembuatan dipisah menjadi hook draft/API, hook peta, dan panel langkah; pengguna dapat memilih outlet melalui daftar tanpa bergantung pada SDK peta. Perubahan pilihan menghapus rekomendasi lama dan respons async usang diabaikan. Supervisor dapat ditetapkan tanpa sales; daftar sales mengikuti tim supervisor.

Pemindahan outlet menyinkronkan jumlah aktif dan menghapus rute referensi pada wilayah yang terdampak, termasuk cache detailnya. Penghapusan kluster aktif yang masih mempunyai outlet, sales, atau registrasi ditolak dengan petunjuk. Wilayah penampung “Belum Ditugaskan” dilindungi. Verifikasi database lokal: `npm --prefix server run verify:clusters`; fixture dibersihkan setelah pengujian.


Kluster GT/MT: pemilihan jenis membatasi outlet daftar/peta; backend menolak campuran pada pembuatan, perubahan anggota, impor, perubahan master outlet, dan aktivasi registrasi. Penampung outlet yang dilepas juga dipisah berdasarkan jenis. Pilihan supervisor hanya ditampilkan bagi admin, sedangkan supervisor otomatis menjadi penanggung jawab. Data lokal Klaster Lembang (8 GT, 2 MT) dan Padalarang (5 GT, 2 MT) dipisahkan melalui script idempotent `server/scripts/repair-mixed-clusters.mjs`; histori PJP dan absensi tetap tersimpan dan rute lama yang terdampak dibersihkan.


Tabel operasional menggunakan `DataTable` dan `styles/common/DataTable.css` untuk warna header, tipografi, kepadatan sel, divider, hover/fokus baris, aksi, serta kartu mobile. Lima belas tabel lintas role memakai surface yang sama; matriks PJP memakai token tabel yang sama. Alignment angka, status semantik, kolom lengket, dan ukuran tabel cetak mengikuti kebutuhan datanya. Padding sel dari modul dihapus agar pengaturan bersama menjadi sumber tunggal.


Regresi render peta kluster: hasil filter GT/MT dimemoisasi berdasarkan daftar outlet dan jenis aktif. Pembaruan state marker tidak lagi membuat daftar filter baru dan memicu efek tanpa henti. Script `verify:cluster-render` memeriksa render berulang dari context, pergantian GT/MT, perubahan data outlet, status sibuk, dan cleanup tanpa UI browser.


### Tim, Master RJP dan cakupan data uji (7 Oktober 2026)
- Perbaikan middleware `/teams`: factory authorize harus dipanggil; pemasangan sebagai handler langsung sebelumnya menahan request tanpa next/response. Verifikasi HTTP mencakup 200/401/403 dan deadline.
- Tim menggunakan API canonical supervisorId, tabel bersama, filter anggota/belum ditugaskan, dan status request. Editor akun dan tim lokal lama dihapus; admin mengelola akun lewat Manajemen Pengguna.
- Kluster disatukan dalam tab Wilayah Master RJP. ID navigasi lama tetap membuka Master RJP untuk kompatibilitas. Siklus template awal berasal dari kalender backend; query hanya menyertakan atribut outlet yang dipakai matriks.
- Seed diperluas melalui coverage.js dan legacy-staff.js; riwayat dua minggu, GT/MT, tim bawaan, pemulihan primary cluster terhapus, rute supir bawaan dan outlet luar PJP terpisah. Tidak mereset transaksi lama atau sandi.


### Navigasi admin
- Satu registry kategori digunakan beranda, sidebar, dan daftar menu mobile; semua modul mengikuti hak akses. Operasional, Outlet, Pengiriman, serta Laporan & sistem memiliki nama dan urutan konsisten.
- Beranda memakai grid modul tanpa slider atau kartu duplikat. Akses cepat menampilkan order/izin, packing, jadwal, dan laporan. Header menunjukkan lokasi halaman dan tombol kembali ke beranda.
- Mobile menampilkan Beranda, Order & izin, Packing, Laporan, serta Menu; menu lengkap dikelompokkan dan dapat dipilih dengan keyboard. Komponen slider dan statistik beranda lama dihapus.
- Verifikasi UI mencakup setiap modul dapat dijangkau, ID unik, hak akses, urutan navigasi mobile, dan penanda halaman induk saat membuat kluster.
