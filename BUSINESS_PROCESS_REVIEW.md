# Proses bisnis dan hasil refactor

Status implementasi lokal: 7 Oktober 2026. Pemetaan dilakukan dari navigasi, API, service, skema, dan pengujian script. Tidak ada inspeksi tampilan browser, sesuai permintaan pengguna.

## Keputusan yang diterapkan

1. Nominal dan SKU order pada laporan hanya berasal dari order APPROVED. Order pending/ditolak tetap merupakan aktivitas dan antrean, bukan penjualan disetujui.
2. Nominal/SKU saat absen keluar bersifat opsional. Admin menentukan izin input dan perlakuan: NOTES_ONLY (default) atau REQUIRE_APPROVAL. Mode tersimpan sebagai snapshot pada pengajuan. Tidak ada mode menghitung hasil tanpa approval.
3. Default packing list adalah input manual admin, dengan tabel approved/pending/rejected sebagai referensi. Dokumen boleh dibuat tanpa order. Admin melengkapi, mengedit, lalu mengirim kepada kepala gudang. Alur dari order disetujui dan pembuatan otomatis menjadi opsi admin.
4. Gudang mengalokasikan dokumen released ke satu atau beberapa kendaraan. Karton dan jumlah per barang diperiksa terpisah. Dokumen belum lengkap tidak dapat diberangkatkan.

## Tanggung jawab setiap role

| Role | Alur kerja dan hasil |
|---|---|
| Admin | Mengatur katalog, harga, kebijakan operasional, pengguna/role, wilayah/jadwal; memutuskan pengajuan; menyusun dan melepas packing list; membaca laporan dan histori. |
| Sales | Shift → PJP tersimpan → IN toko → order atau catatan hasil → OUT → toko berikutnya → shift keluar. Mengajukan toko tutup, pengecualian GPS/unlock, luar PJP, dan NOO. Mengerjakan tindak lanjut audit yang ditugaskan kepadanya. |
| Supervisor | Mengatur jadwal tim; meninjau order, kunjungan ekstra, hasil manual, NOO, dan pengecualian; memutuskan skip/reroute; memilih toko untuk pendampingan/audit; menetapkan pemilik, tenggat dan penyelesaian tindak lanjut. Akses data sales dibatasi tim primary maupun assigned cluster. |
| Kepala gudang | Melihat packing list released dan sisa muatan; memilih supir/kendaraan dan membagi muatan; menyiapkan rute; memonitor hasil; memeriksa penerimaan retur; mengalokasikan pengiriman ulang; mencatat perawatan. Tidak membuat atau mengubah dokumen packing milik admin. |
| Supir | Memilih rute tugas → IN dengan GPS/foto → mencatat diterima/ditolak/sebagian dan rincian → OUT. Hasil final tidak ditimpa. Semua hasil selesai menutup rute dan memposting jarak kendaraan sekali. |
| Role kustom | Memakai role dasar operasional dan template izin admin. Kode kustom disimpan terpisah dari enum role, dipertahankan ketika akun diedit, dan dibaca ulang saat autentikasi. |

## Definisi metrik

- **Jumlah PJP/toko terencana:** stop yang tersimpan pada PJP, bukan target konfigurasi. Reroute mempertahankan stop asli sebagai SKIPPED dan menambah pengganti; penyebut menunjukkan rencana revisi beserta jejak pengecualiannya.
- **Realisasi:** kunjungan yang memiliki IN/OUT; laporan kunjungan juga mempertahankan fallback status selesai untuk riwayat lama. Selesai berarti OUT, berlangsung berarti IN tanpa OUT, menunggu berarti belum dimulai. Tutup/dilewati bukan kunjungan selesai.
- **Belum absen:** toko tanpa IN; **sisa kunjungan:** menunggu + berlangsung. Pengecualian menyelesaikan proses rute tetapi tidak menjadi kunjungan selesai. Kedua istilah ini memang berbeda.
- **Kepatuhan PJP:** realisasi toko dalam jadwal / jumlah stop terencana. Kunjungan luar PJP yang tervalidasi masuk total realisasi tetapi tidak menaikkan pembilang kepatuhan PJP.
- **EC:** kunjungan nyata dengan nominal atau SKU disetujui. Approval order tanpa absensi tidak menjadi EC.
- **SKU:** jenis produk unik dalam satu stop/order yang disetujui. Rekap menjumlahkan SKU per kunjungan; bukan jumlah unit atau produk unik sepanjang bulan.
- **Nominal:** nilai order APPROVED. Jika ada order terperinci pada stop, hasil manual tidak menjadi fallback atau tambahan. Hasil manual hanya dihitung bila tidak ada order dan pengajuan manual telah disetujui sesuai snapshot kebijakan.
- **Luar PJP:** validasi kunjungan dan approval transaksi manual merupakan dua keputusan. Validasi kunjungan tidak otomatis mengesahkan nominal/SKU.
- Tanggal bisnis memakai WIB. Mingguan mencakup Senin–Minggu, termasuk aktivitas historis pada hari nonkerja. Hari kerja MTD dan matriks mengikuti PJP_WORKING_DAYS; bulan mendatang memiliki hari kerja berjalan nol.

## Penyelesaian temuan audit B01–B18

| Temuan awal | Implementasi akhir |
|---|---|
| B01 NOO | Status awal tidak dapat dipalsukan dari form; approval/penolakan bersyarat atomik; aktivasi wajib SPV_APPROVED, kode, GPS valid dan klaster eksplisit. Outlet dibuat dalam transaksi, pembayaran/termin/jadwal dipertahankan; koordinat baru UNVALIDATED. |
| B02 Pembentukan PJP | Scheduler dan pembacaan memakai generator sama. Editor menyimpan template hari dan siklus. Template kosong mengalahkan fallback, minggu ISO dihitung benar, hari kerja/siklus/fallback dapat diatur. PJP terbentuk tidak ditulis ulang saat master berubah. |
| B03 Penugasan wilayah | Pelepasan memakai klaster Belum Ditugaskan yang nyata; wilayah asing ditolak; outletCount direkonsiliasi; rute referensi divalidasi terhadap anggota klaster. Sinkronisasi akun/klaster atomik. |
| B04 Shift | Wajib shift aktif menjadi opsi admin. Shift lama yang terbuka dapat ditutup; kunjungan terbuka mencegah shift keluar. IN/OUT dan kunjungan supervisor diserialisasi per pengguna. |
| B05 Pengecualian absensi | Persetujuan berlaku bagi pemohon + outlet + masa berlaku. Backend memeriksa lock dan GPS. Tidak membuka toko untuk semua sales; tidak melewati urutan PJP. |
| B06 Insiden rute | Satu service keputusan skip/reroute; approval admin opsional; penolakan memulihkan stop; stop terakhir merekonsiliasi PJP. Boleh lanjut saat menunggu menjadi parameter. |
| B07 Nominal/SKU | APPROVED saja; hasil manual memakai approval terpisah dan snapshot; pencegahan hitung ganda. |
| B08 Pembayaran | CASH/TOP/TRANSFER seragam. Hari termin terpisah, disimpan bersama order. |
| B09 Kredit dan stok | Label tidak mengklaim pengendalian kredit/inventori. Stok produk adalah referensi; bukan buku mutasi. Persetujuan order tidak menyatakan saldo piutang telah diverifikasi. |
| B10 Rekap | Metrik kunjungan/penjualan bersama, filter registrasi mengikuti periode, pembilang PJP terpisah dari luar PJP, tanggal WIB dan kalender kerja seragam. |
| B11 Luar PJP | Validasi kunjungan terpisah dari approval nominal/SKU; scope tim dan keputusan ulang dibatasi. |
| B12 Supervisi | Pemilihan toko eksplisit; batas aktivitas opsional ditegakkan backend; audit menyimpan pemilik/tenggat/catatan/status/history tindak lanjut yang dapat diselesaikan penerima. |
| B13 Packing | Input manual admin sebagai default, referensi order, draft/release/revisi, opsi otomatis, histori dan alokasi muatan lintas kendaraan. |
| B14 Hasil/retur | Hasil final immutable; barang dan karton ditolak divalidasi; faktur direkonsiliasi dari bagian diterima. Retur diterima sekali dengan catatan, baru dapat dialokasikan ulang sesuai opsi admin. |
| B15 Rute/kendaraan | Matriks status, penutupan tunggal, odometer diposting sekali, jarak gudang dan konsumsi dari parameter/spesifikasi. Mulai melalui IN supir memakai aturan jarak yang sama. |
| B16 Izin | Identitas/izin dibaca dari akun aktif; penolakan eksplisit dihormati API fitur dan navigasi. Akun, role dan konfigurasi tetap memerlukan role dasar ADMIN. Gudang memiliki pilihan supir nyata dengan akses daftar dibatasi SUPIR. |
| B17 Scope | Baca/approval order, PJP, laporan, NOO, unlock, insiden, template dan validasi outlet dibatasi penugasan tim. Notifikasi pengajuan operasional diarahkan kepada pihak terkait. Socket memakai token dan ruang privat pengguna. |
| B18 Parameter | Pajak/termin disnapshot pada order, kebijakan harga termasuk pajak tersedia, lokasi gudang dipakai routing, kalender dan aturan operasional terhubung ke backend. Default berlaku pada tindakan berikutnya, bukan menimpa master/histori. |

## Batas cakupan

Aplikasi mengelola aktivitas, order disetujui dan dokumen pengiriman. Buku besar stok, piutang/kredit, impor ERP otomatis dan target individual dengan tanggal efektif belum menjadi modul dalam pekerjaan ini. Nilai stok/estimasi margin/jarak tidak dinyatakan sebagai saldo inventori, hasil keuangan atau kilometer GPS aktual. Catatan luar PJP supervisor merupakan catatan pengecualian, bukan bukti kunjungan GPS/foto yang setara IN/OUT.

## Engineering dan verifikasi

Aturan metrik, kalender dan konfigurasi berada di shared; keputusan penjualan manual, penugasan klaster, packing, siklus rute, pengecualian absensi dan tindak lanjut dipisahkan per service. Jalur mutasi status PJP langsung yang tidak memiliki bukti absensi dihapus. Modul/stylesheet frontend tak terjangkau dibersihkan, 110 binding import tidak dipakai dihapus. Pemeriksaan source menjadi regresi bagi syntax/import/variabel tidak terdefinisi serta jangkauan frontend.

Pemeriksaan terakhir pada database lokal:

| Pemeriksaan | Hasil |
|---|---|
| npm --prefix server test | 71 tes lulus |
| npm --prefix server run verify:operational | 85 assertion integrasi lulus |
| npm --prefix server run verify:packing | 26 pemeriksaan lulus |
| npm --prefix server run verify:manual-sales | 14 pemeriksaan lulus |
| npm --prefix server run verify:source | 521 modul parsed; tidak ada import tak dipakai, referensi putus, variabel tak terdefinisi atau modul frontend tak terjangkau |
| npm --prefix client run build | 388 modul; chunk utama sekitar 221 KB; tidak ada peringatan chunk 500 KB |
| Prisma validate | Skema valid |

Fixture integrasi dibersihkan dalam finally. Kebijakan diuji memakai mock proses, tanpa mengubah konfigurasi operasional. Penyedia peta eksternal dimock pada tes; ketersediaan layanan tersebut tidak termasuk hasil verifikasi. Perubahan belum dideploy ke lingkungan lain. Rincian parameter dan migrasi ada di OPERATIONAL_REFACTOR.md serta PACKING_WORKFLOW.md.

## Tim, PJP, dan validasi outlet (7 Oktober 2026)
- Tim sales menggunakan `User.supervisorId`, terpisah dari klaster utama dan wilayah yang ditugaskan. Migrasi mengambil supervisor dari klaster utama atau satu supervisor wilayah yang tidak ambigu; sisanya perlu penugasan admin.
- Admin dapat menetapkan, mentransfer, dan melepas sales. Supervisor hanya mengambil sales tanpa tim jika `TEAM_SPV_CAN_CLAIM_UNASSIGNED` aktif. Penugasan membutuhkan alasan dan revisi data terakhir; transfer serentak ditolak bila revisinya sudah berubah.
- Transfer melepas wilayah di luar tim tujuan, mengosongkan klaster utama dan template mendatang. PJP/absensi yang sudah terbentuk tetap. Supervisor tujuan menyusun wilayah dan template kembali; pengawasan data sales mengikuti tim saat ini.
- Klaster tidak dapat menerima sales dari tim lain. Jadwal hanya menerima outlet aktif di wilayah tim sales. Rotasi lintas supervisor ditolak. Hari kosong, hari kerja admin, dan siklus ISO/bulanan dipertahankan.
- UI perencanaan: Tim → Wilayah/outlet → Template mingguan → PJP terbentuk. Pratinjau memakai sales ID dan tanggal; jadwal kosong tidak mengambil toko dari sales lain.
- Koreksi GPS membutuhkan alasan, pemeriksaan revisi, dan riwayat koordinat. Koreksi serta perubahan identitas/alamat mengembalikan status belum diperiksa.
- Status perbandingan Google bukan bukti kunjungan fisik. Gangguan provider tidak mengubah status; hasil serentak tidak menimpa data baru. Kandidat lama dibersihkan, kandidat terlalu jauh tidak disarankan.
- Workspace supervisor: perencanaan, permintaan/order, kunjungan/audit, rekap. Dialog utama memakai dialog native dengan fokus/ESC; shell memakai viewport dinamis, safe area, navigasi browser, menu mobile admin, dan pemberitahuan offline. Pengiriman offline tidak diantrikan otomatis.
