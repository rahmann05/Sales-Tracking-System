# Audit sumber Belfoods dan keputusan seed

Audit dilakukan secara baca-saja terhadap seluruh folder Analisis: workbook, JSON utama/salinan/per-sales, cache CSV, notebook, map_data, hasil HTML dan dokumen analisis. Notebook tidak dieksekusi dan layanan geocoding tidak dipanggil. Inventaris ukuran/hash terdapat di `server/prisma/belfoods/source-audit.json`.

## Temuan

1. JSON callplan memuat 443 outlet unik, lima sales fisik dan tujuh varian jadwal. Cahya dan Dadan masing-masing mempunyai W1/W2; Puri, Yati dan Yuli mempunyai satu varian. Data ini adalah rencana kunjungan, bukan bukti kunjungan selesai.
2. Workbook mempunyai 444 baris bisnis. Sebanyak 443 baris berjadwal sesuai dengan identitas/alamat/koordinat pada JSON, tetapi 24 baris mempunyai perbedaan CallplanID. Baris Excel 440, BFI2168878 TOKO INTIK KURIH, tidak mempunyai hari dan koordinatnya merupakan proxy sekolah yang perlu diperiksa; tidak dipakai dalam seed planner.
3. CallplanID SLD534ALLWEEK dipakai oleh Yati dan Yuli pada JSON. Karena itu identitas tim mengikuti kode sales dan CustomerID; tidak digabung hanya berdasarkan CallplanID. Fixture menyimpan CallplanID Excel dan JSON beserta nomor baris untuk penelusuran.
4. Distribusi confidence sumber: 88 high, 11 medium, 7 low, 326 unknown dan 11 none. Ada delapan koordinat tidak valid dan 15 baris tidak memenuhi pemeriksaan rentang Jawa Barat (termasuk data kosong/tidak valid); dua kelompok koordinat digunakan bersama. Rentang geografis hanya penyaringan awal, bukan penilaian validitas outlet.
5. Cache berisi 443 baris, tanpa hasil Google Places maupun Google reverse geocoding, dan 428 hasil OSM. Seluruh 443 baris memperoleh score_dist 100 meskipun hasil Places kosong. Skor gabungan cache tidak layak menjadi dasar otomatis untuk menyatakan outlet terverifikasi.
6. Salinan root, file per-sales dan map_data konsisten terhadap JSON utama. Notebook/HTML adalah turunan dari sumber yang sama, sehingga bukan bukti independen. Kredensial yang tertanam pada notebook tidak disalin ke aplikasi atau seed.
7. Sumber tidak menyediakan kontak pemilik/telepon terverifikasi, produk, harga, pembayaran, transaksi, timestamp absensi, armada, bukti GPS perangkat atau tanggal acuan frekuensi kunjungan.

## Keputusan implementasi

20 outlet dipilih untuk mencakup seluruh tujuh varian, masing-masing empat per sales. Kode outlet, nama, alamat dan koordinat dipertahankan dan diperiksa terhadap workbook. Isi sampel ditulis langsung dalam modul JavaScript `server/prisma/belfoods/fixtures.js`; seed tidak membuka file JSON atau sumber Analisis saat berjalan.

Seluruh master lama berstatus UNVALIDATED, tanpa confidence aplikasi, validatedAt atau kontak rekaan. Confidence dan catatan sumber tetap menjadi metadata historis. Validasi opsional mempunyai dua contoh permintaan OPEN, tanpa riwayat hasil provider palsu.

Cluster/channel dan frekuensi F2 untuk Cahya/Dadan, F4 untuk Puri, F1 untuk Yati/Yuli adalah konfigurasi uji yang dikurasi. W1/W2 dipertahankan sebagai varian historis; planner baru mempunyai tanggal acuan simulasi eksplisit. Tidak disimpulkan bahwa suffix callplan sumber membuktikan interval atau tanggal acuan.

Data kegiatan operasional dibangun terpisah sebagai skenario Uji Belfoods. Pembayaran hanya dicatat sebagai janji/tindak lanjut untuk proses eksternal. Lokasi titik outlet merupakan koordinat historis; posisi live Sales/Driver tetap kosong sampai perangkat nyata mengirim lokasi. Tidak ada seed foto atau bukti lokasi perangkat palsu.

## Verifikasi

Dry-run reset dengan rollback lulus dan seluruh data tersimpan sebelumnya sama. Reset aktual membuat backup lengkap yang dapat dibaca oleh pg_restore, kemudian membersihkan seluruh tabel bisnis dan memasukkan dataset dalam satu transaksi. Riwayat migration tetap utuh. `verify:seed` membandingkan seluruh tabel pada dua seed ulang; `verify:workspace-data` menguji middleware dan cakupan data melalui HTTP lokal.
