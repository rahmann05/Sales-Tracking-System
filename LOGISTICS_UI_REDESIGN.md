# Sales, Kepala Gudang, dan Driver — implementasi 9 Oktober 2026

Perubahan diterapkan pada aplikasi utama. Tidak ada penambahan saldo stok atau proses pembayaran di dalam aplikasi. Pembayaran tetap dilakukan di luar aplikasi; pelaporan kunjungan dan pencatatan hasilnya tetap mengikuti alur yang sudah ada.

## Perubahan

- Sales: formulir order, kunjungan, permintaan buka kunci, toko tutup, kunjungan di luar PJP, pendaftaran pelanggan, dan tindak lanjut memulihkan draft teks dalam sesi browser per akun dan tugas. Penutupan formulir yang sudah diisi meminta konfirmasi di dalam aplikasi. Foto/GPS baru tidak dipulihkan sebagai bukti baru; pengajuan dengan respons belum pasti mempertahankan payload dan identitas yang sama untuk percobaan ulang.
- Kepala Gudang: beranda enam menu sesuai izin; antrean packing yang sudah dirilis Admin; rencana trip; pemantauan lintas tanggal; tindak lanjut dan sisa pemenuhan; kendaraan/servis; presensi. Halaman menggunakan daftar dan rincian dengan status muatan, persiapan, hasil pengiriman, retur, dan sumber/waktu lokasi.
- Driver: beranda dua menu; trip aktif dan tujuan berikutnya; daftar tujuan berurutan dan rincian tunggal; pemisahan tujuan diproses, diterima penuh, diterima sebagian, dan ditolak. Peta tujuan menampilkan koordinat outlet dan tautan navigasi. Pemantauan gudang membedakan GPS terkini, GPS terakhir, dan titik absensi.
- Navigasi desktop dan mobile konsisten dengan Admin/SPV/Sales. Beranda tidak menduplikasi menu melalui sidebar. Perubahan yang belum disimpan dilindungi saat berpindah halaman/trip, termasuk pemeriksaan retur. Data lama akibat kegagalan pemuatan diberi keterangan dan tindakan operasional dinonaktifkan.

## Verifikasi

- Build produksi: berhasil, 561 modul.
- Pemeriksaan sumber: 744 modul; import, ekspor, dan referensi valid.
- Arsitektur frontend: 430 modul, AppRouter 296/300 baris.
- Kontrak UI lima peran dan menu/izin logistik: lulus.
- Dialog: penutupan formulir kosong, konfirmasi inline, batal tutup, kondisi sedang mengirim, navigasi dan unload: lulus melalui harness komponen.
- Draft: pemulihan reload, perubahan field berurutan, isolasi akun/tugas, proyeksi bukti, hapus setelah berhasil, kegagalan penyimpanan: lulus melalui harness hook.
- Kunjungan di luar PJP: 17 pemeriksaan identitas/payload tetap, respons tidak pasti, koreksi validasi, dan pengiriman ganda cepat: lulus.
- Unit test terpilih: 46 lulus, mencakup draft, pilihan trip, lokasi, kontrol pengiriman, packing, order, review tindak lanjut, dan hasil kunjungan.
- Integrasi PostgreSQL lokal: 148 assertion lulus. Alur Sales → SPV → Admin → Kepala Gudang → Driver, persiapan fisik, pengiriman sebagian, retur, pengiriman ulang, penolakan penuh, penutupan, kilometer kendaraan, dan batas akses. Data fixture diisolasi dan dibersihkan; notifikasi eksternal dimock.
- Browser: tampilan build produksi diperiksa menggunakan data sintetis pada desktop 1440 piksel dan mobile 360/390 piksel. Halaman beranda, monitor gudang, trip Driver, dan peta diperiksa. Tombol peta yang terjepit pada 360 piksel diperbaiki. Server preview menolak penulisan transaksi.

## Batas pengujian

Belum ada ponsel fisik untuk menguji izin GPS/kamera, akurasi lokasi, perilaku browser saat layar mati, dan jaringan lapangan. GPS langsung bergantung pada izin, halaman aktif, serta konektivitas; tidak dijanjikan berjalan terus di latar belakang. Interaksi browser otomatis lanjutan sempat terhalang konfirmasi native pada tab uji versi lama. Konfirmasi penutupan kini memakai dialog inline dan diuji melalui harness; interaksi formulir lengkap tetap perlu smoke test pada browser/perangkat nyata. Pengujian integrasi alur transaksi di server sudah lulus.

Tidak ada commit, push, atau deployment pada tahap ini.
