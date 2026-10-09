# Audit alur cluster dan PJP — 9 Oktober 2026

## Status setelah perombakan

Bagian temuan di bawah adalah rekaman kondisi **sebelum perombakan**. Implementasi kini menggunakan alur **Wilayah & outlet → Planner kunjungan → PJP diterbitkan**.

- F1/F2/F4 telah dikonfirmasi pengguna sebagai interval setiap 1/2/4 minggu sejak tanggal acuan. Pergantian bulan tidak mengulang siklus.
- Rencana tersimpan di server sebagai draft dengan revisi, riwayat, pemeriksaan versi, pratinjau tanggal nyata, dan penerbitan eksplisit. Pembacaan daftar/hari ini tidak membentuk PJP.
- Rencana dapat disalin ke periode berikutnya dengan tanggal acuan tetap, sehingga interval F2/F4 tidak dimulai ulang setiap penyusunan periode. Salinan wajib ditinjau dan diterbitkan kembali.
- Penerbitan memeriksa Sales aktif, kepemilikan tim, outlet aktif, hari kerja, benturan antar-Sales dan PJP yang sudah terbit. Penugasan pengganti serta perubahan interval memerlukan alasan; cakupan yang belum lengkap harus ditinjau.
- Builder wilayah dimulai dari tim. Pemilihan marker tidak mengganti seluruh daftar; saran outlet terdekat harus diterapkan secara eksplisit. Beberapa cluster Sales tidak lagi saling mengganti cluster utamanya.
- Perpindahan anggota/penanggung jawab dan impor memiliki pratinjau dampak serta token pemeriksaan data terbaru. Hitungan anggota dan rute referensi diselaraskan. Editor master outlet mengarahkan perpindahan ke pengelolaan wilayah.
- Histori PJP yang sudah terbit tidak ditimpa. Template lama dapat diambil sebagai **saran draft**, kemudian wajib diperiksa ulang. Rencana terbit tidak diedit langsung; gunakan alur perubahan rute yang terkontrol.
- Tampilan planner memakai panel aturan dan kalender pada desktop, lalu menumpuk pada layar sempit. Draft sesi dipulihkan dan navigasi melindungi perubahan yang belum disimpan.

Migrasi `202610090001_pjp_planning` telah diterapkan pada database lokal dan Prisma Client telah disegarkan. Tidak ada penerbitan massal atau konversi otomatis terhadap data operasional lama; supervisor perlu meninjau dan menerbitkan rencana berikutnya.

Verifikasi database/API: 58 pemeriksaan planner serta 148 pemeriksaan regresi operasional lulus. Uji unit, cluster, kontrak UI, dan stabilitas render peta juga lulus. Pengujian visual browser **belum terverifikasi** karena browser bawaan menolak akses server pengujian lokal (`ERR_BLOCKED_BY_CLIENT`); jangan menganggap pemeriksaan komponen sebagai pengujian visual/perangkat nyata.

Skrip audit lama di akhir dokumen hanya mereproduksi perilaku helper kompatibilitas; jalankan `npm run verify:pjp-planning` dari folder `server` untuk pengujian alur pengganti (`server/tests/pjp-planning.integration.mjs`).

## Kesimpulan

Struktur saat ini sudah membedakan wilayah outlet, template mingguan, dan PJP harian, tetapi belum membentuk proses perencanaan yang dapat ditinjau sebelum berlaku. Masalah terbesar: pembentukan PJP terjadi saat pembacaan data, dampak perubahan wilayah tidak ditampilkan, sumber jadwal tidak jelas, dan belum ada pemeriksaan cakupan serta benturan lintas Sales.

Audit berdasarkan pembacaan kode UI, API, model data, serta reproduksi lima kelompok perilaku menggunakan service aplikasi dengan dependensi terisolasi. Tidak ada perubahan data operasional atau implementasi perombakan produk pada tahap audit. Tata letak dibaca dari komponen/CSS; belum ada pengujian visual browser baru untuk modul ini.

## Temuan prioritas tinggi

### 1. Membuka daftar PJP dapat membentuk dan membekukan jadwal hari ini

`server/src/modules/pjp/services/get-all-pjps.service.js:16` memanggil generator untuk seluruh Sales sebelum query daftar yang dibatasi akses. `pjp.helpers.js:34` langsung mengembalikan PJP yang sudah terbentuk.

Contoh: Admin membuka monitor pagi hari sebelum SPV selesai mengedit template. PJP terbentuk dari template lama/fallback. Penyimpanan template setelah itu tidak memperbarui PJP tersebut, sekalipun kunjungan belum dimulai. PJP berikutnya pada tanggal mendatang pun belum dapat dipratinjau melalui generator yang hanya menerima hari ini.

Mempertahankan PJP yang sudah berjalan adalah benar. Kekurangannya ialah tidak ada tahap draft, tinjau, tanggal berlaku, dan penerbitan yang jelas. Kesalahan pembentukan juga hanya dicatat pada console server sehingga layar dapat menyerupai kondisi tidak ada jadwal.

### 2. Pemindahan outlet dapat memutus jadwal tanpa laporan dampak

`create-cluster-full.service.js` dan `update-cluster-outlets.service.js` memindahkan anggota outlet serta menghapus rute referensi cluster terdampak. Template yang menunjuk outlet tersebut tidak diselaraskan. Generator pada `pjp.helpers.js:43` menyaring outlet yang sudah berada di luar tim atau tidak aktif.

Contoh: template Senin berisi A dan B; A dipindah ke tim lain. Template masih menyimpan A, tetapi PJP baru hanya berisi B tanpa menjelaskan outlet yang dikeluarkan. Dalam tim yang sama, jadwal lama tetap dapat menunjuk outlet yang sudah diberi Sales lain.

Sebelum perpindahan, tampilkan cluster asal/tujuan, Sales dan template terdampak, PJP yang sudah diterbitkan, serta keputusan penjadwalan ulang. Jangan mengubah bukti kunjungan yang sudah tercatat.

### 3. Penugasan beberapa cluster tidak sama dengan sumber PJP otomatis

Satu Sales dapat terhubung ke beberapa `Cluster.assignedSalesId`, sedangkan `User.clusterId` hanya menyimpan satu cluster utama. Membuat cluster baru dengan Sales yang sama mengganti `User.clusterId` (`create-cluster-full.service.js:50`). Fallback PJP hanya membaca `sales.clusterId` (`pjp.helpers.js:45–49`).

Akibatnya, cluster lama masih terlihat ditugaskan kepada Sales, tetapi tidak ikut fallback otomatis. UI perlu menjelaskan wilayah tanggung jawab versus sumber jadwal. Rekomendasi: gunakan penugasan wilayah untuk menentukan kumpulan outlet yang dapat dijadwalkan; daftar kunjungan harus berasal dari rencana yang eksplisit.

### 4. Jadwal ganda dan outlet yang tidak tercakup belum diperiksa

`templates.service.js` menolak outlet duplikat di dalam satu entri, tetapi tidak memeriksa outlet yang sama pada dua Sales untuk hari/siklus yang sama. Reproduksi berhasil menyimpan kedua penugasan tersebut.

Tidak ada ringkasan outlet belum dijadwalkan, outlet berulang lintas Sales, atau kesenjangan frekuensi. Tambahkan peringatan dan penjelasan benturan; kunjungan bersama yang disengaja dapat diizinkan dengan alasan, bukan dilarang tanpa mempertimbangkan kebutuhan bisnis.

### 5. Frekuensi dan fallback belum membentuk rencana kunjungan yang terukur

Impor menerima F1/F2/F4 dan menyimpannya pada `Outlet.itineraryCode`, tetapi generator PJP tidak menggunakan field tersebut. Fallback aktif secara default; tanpa template, semua outlet pada cluster utama dapat masuk setiap hari kerja, atau hanya subset rute aktif jika tersedia.

Makna F1/F2/F4 perlu ditetapkan secara eksplisit sebelum otomatisasi. Keterangan konfigurasi saat ini menyebut interval minggu; jangan menganggap kode sebagai jumlah kunjungan per bulan. Jadwal perlu memperlihatkan interval, tanggal acuan, tanggal berikutnya, dan jumlah rencana pada periode nyata.

### 6. Impor dan edit manual menghasilkan dampak yang berbeda

`import-rjp.service.js:21–28` mencocokkan cluster melalui nama lalu memperbarui outlet, cluster, koordinat, frekuensi, dan status validasi lokasi. Jalur ini tidak menyinkronkan `outletCount` dan tidak membatalkan rute lama seperti jalur edit anggota cluster. Rute aktif yang masih tersimpan dapat berisi anggota lama dan melewatkan outlet baru saat fallback.

UI impor hanya mempratinjau baris CSV dan menampilkan “Format Valid”. Belum ada pratinjau tambah/perbarui/pindah, akibat terhadap jadwal, atau ringkasan perubahan koordinat. Parsing juga berdasarkan posisi kolom, bukan pemetaan nama header. Nama cluster bukan identitas yang cukup tegas jika terdapat nama sama.

Gunakan kode/ID, pemeriksaan server sebelum penerapan, dan satu layanan perubahan keanggotaan untuk impor maupun edit manual.

## Kekurangan alur dan UX

1. **Pemilihan pada peta mengganti pilihan.** Klik marker memanggil `selectCenter`, mengosongkan pilihan, lalu mengambil N outlet terdekat. Mengubah jumlah juga mengganti pilihan manual. Pisahkan “pilih outlet” dan “sarankan berdasarkan titik”; saran harus dipratinjau sebelum diterapkan.
2. **Penanggung jawab dipilih terlambat.** Wizard meminta region dan outlet sebelum tim/Sales. Untuk Admin, wilayah tim yang dituju belum membatasi pilihan awal. Mulai dari tim dan tujuan penyusunan wilayah.
3. **Sumber template tersembunyi.** Matriks WEEK_1/WEEK_2 menampilkan fallback ALL tanpa penanda asal. Mengeditnya membuat override khusus. Pengguna perlu melihat “mengikuti template umum” versus “jadwal khusus”, serta tindakan kembali mengikuti umum.
4. **Tidak ada kalender tanggal nyata.** Label siklus ganjil/genap atau rentang tanggal belum memperlihatkan hasil kunjungan pada periode tertentu. Hari tanpa kunjungan, template belum dibuat, libur, dan kegagalan pembentukan dapat berakhir sebagai daftar kosong yang sama.
5. **Rotasi belum dapat ditinjau.** Semua jadwal berpindah sesuai urutan nama dalam tabel. Admin dengan beberapa tim ditolak setelah menekan terapkan, tanpa pemilihan tim. Perlu pilih tim/periode dan tabel sebelum/sesudah, termasuk override yang akan dibuat.
6. **Rute dan beban kerja kurang terhubung.** Rute referensi cluster opsional, sedangkan editor jadwal menyusun toko satu per satu tanpa peta, jarak, atau estimasi durasi. Optimasi cluster memakai jarak antartitik, belum mempertimbangkan jam kunjungan atau kapasitas waktu kerja. Estimasi harus diberi label sesuai dasar hitungnya.
7. **Draft perencanaan belum dilindungi.** Builder cluster memakai state memori; editor cluster, anggota outlet, dan jadwal memakai NativeDialog tanpa guard perubahan. Navigasi/reload dapat menghilangkan kerja penyusunan.
8. **Tidak ada versi dan riwayat perubahan template.** Simpan langsung mengganti seluruh stop tanpa versi sebelumnya, alasan, tanggal berlaku, dan pemeriksaan revisi klien. Lock transaksi mencegah penulisan serentak yang rusak, tetapi tidak mencegah pengguna dengan data lama menimpa perubahan terbaru.
9. **Izin UI belum rinci.** Tombol pengelolaan dalam RoutePlanningPage terutama berdasarkan peran Admin/SPV, sementara server membedakan `can_manage_clusters` dan `can_manage_rjp`. Tombol perlu mengikuti izin aktual dan status data.
10. **Indikator belum menunjukkan kesiapan.** Status cluster “ACTIVE”, jumlah outlet, dan persentase alokasi tidak menunjukkan apakah Sales, jadwal, frekuensi, serta koordinat siap. Badge “Sudah berwilayah” juga muncul ketika outlet berada dalam cluster penampung karena hanya memeriksa `clusterId`.

## Alur pengganti yang disarankan

### A. Wilayah dan anggota outlet

Pilih tim → buat/pilih cluster → tentukan GT/MT → pilih outlet melalui daftar dengan peta pendamping → tinjau perpindahan dan dampak jadwal → simpan wilayah.

Tampilkan kode, cluster asal, Sales, koordinat, jadwal aktif, dan frekuensi. Simpan cluster tidak otomatis berarti seluruh anggotanya dikunjungi setiap hari. Pemilihan jenis dan jumlah tidak boleh menghapus pilihan tanpa penjelasan.

### B. Penyusunan rencana kunjungan

Pilih tim dan periode → pilih Sales → gunakan wilayahnya sebagai kumpulan outlet → susun hari/tanggal dan urutan → tinjau kalender, beban kunjungan, cakupan, dan benturan → terbitkan untuk tanggal berlaku.

Desktop: daftar Sales/hari di kiri, rencana dan rincian di tengah, peta opsional di kanan. Mobile: Sales/periode → daftar hari → rincian satu hari. Hindari menjejalkan seluruh matriks ke layar kecil.

Sediakan status Draft, Perlu diperbaiki, Siap diterbitkan, Diterbitkan. Bedakan hari tanpa kunjungan yang disengaja dari jadwal yang belum disusun. Simpan sumber template umum/khusus secara terlihat, dengan kalender hasil per tanggal.

### C. Pelaksanaan PJP

Sales menerima PJP yang telah diterbitkan dengan urutan, tanggal, sumber rencana, dan catatan. Monitor menampilkan diterbitkan/belum siap/gagal terbentuk beserta alasan. Pembacaan daftar tidak boleh menerbitkan rencana untuk seluruh tim.

Perubahan sebelum mulai dapat diterbitkan sebagai revisi setelah pemeriksaan status. Setelah kunjungan dimulai, gunakan perubahan terkontrol dengan alasan dan jejak audit; jangan menghapus riwayat absensi/order. Alur pengecualian toko tutup/reroute yang sudah ada tetap digunakan.

## Urutan implementasi

1. **Integritas perencanaan:** satukan penugasan wilayah, dampak pemindahan/impor, status pembentukan, versi dan revisi, serta pemeriksaan benturan/cakupan.
2. **Perombakan UI:** ruang kerja wilayah dan planner kalender, peta pendamping, draft tersimpan, preview sebelum/sesudah, dan izin tindakan yang konsisten.
3. **Penerbitan dan migrasi:** pratinjau jadwal lama sebagai draft awal; jangan menimpa template/PJP operasional atau mengaktifkan aturan frekuensi yang belum disepakati. Sediakan laporan data yang perlu diperbaiki.
4. **Verifikasi lintas peran:** buat wilayah → jadwalkan → terbitkan → Sales melihat → kunjungan/order → perubahan terkontrol → laporan. Uji perpindahan outlet, beberapa cluster, override ALL, dua editor, duplikasi, hari kosong, dan kegagalan pembentukan.

## Bukti reproduksi

Jalankan `node scripts/audit-pjp-planning.mjs` dari `server`. Skrip membundel service aplikasi dengan data memori dan menegaskan perilaku saat ini: fallback cluster utama tanpa filter F2/F4, PJP yang tetap setelah perubahan template, outlet pindah tim yang dikeluarkan diam-diam, jadwal outlet ganda antar-Sales, serta dua penyebab jadwal kosong yang menghasilkan null.

Kelima kelompok reproduksi lulus pada 9 Oktober 2026. Ini bukan pengujian perbaikan atau bukti kelayakan produksi. Database, jaringan, dan penulisan data pengguna tidak digunakan; pemeriksaan akses distub untuk fixture yang diasumsikan telah berwenang.
