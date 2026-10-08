# Prototipe perombakan Admin

Prototipe visual terpisah untuk mengevaluasi navigasi, layout, kepadatan informasi, dan interaksi sebelum migrasi halaman aplikasi. Semua identitas, nilai, dokumen, dan lokasi adalah data contoh. Tidak memakai autentikasi, API aplikasi, atau database. Perubahan contoh hanya bertahan dalam tab sampai halaman dimuat ulang.

Rancangan navigasi dan alur utama kini sudah diterapkan pada aplikasi utama. Lihat [catatan implementasi dan batas verifikasi](../../ADMIN_UI_REDESIGN.md). Pemeriksaan di bawah tetap merupakan hasil prototipe, bukan hasil transaksi aplikasi utama.

## Jalankan

Dari direktori `client`:

```powershell
npm run dev:admin-preview
```

Buka `http://127.0.0.1:5182/admin-preview.html#home`.

```powershell
npm run build:admin-preview
```

Hasil build berada dalam `client/dist/admin-preview`. Entry dan konfigurasi build terpisah dari aplikasi utama. Menjalankan build utama membersihkan direktori `dist`; jalankan build prototipe sesudahnya bila kedua hasil dibutuhkan.

## Interaksi yang tersedia

- Beranda: tujuh modul, pencarian fitur, pintasan `/`, tanpa sidebar.
- Order: 32 baris, nama outlet panjang, pencarian, filter sales/status, pagination, panel detail, setuju/tolak dengan alasan, pemeriksa/tenggat contoh, hubungan packing. Pencarian/filter/halaman bertahan saat meninggalkan lalu kembali ke modul dalam sesi yang sama.
- Packing: 18 dokumen, pencarian/status, filter sumber order/perjalanan, editor terpisah, penambahan/penghapusan barang dan faktur, pemeriksaan karton, penyimpanan draft/rilis lokal, review rilis, peringatan perubahan belum disimpan.
- Rute: alokasi dokumen yang dirilis, urutan tujuan melalui tombol, kapasitas contoh, kendaraan/driver/waktu, penyimpanan susunan lokal dalam sesi yang sama.
- Monitor: empat perjalanan, pencarian/status, daftar dan peta tersinkron, GPS ponsel aktif/lokasi lama/titik absen/tanpa lokasi, waktu/akurasi, stop diproses vs diterima penuh, hubungan dokumen perjalanan.
- Outlet, Sales & wilayah, Tindak lanjut, Laporan, Sistem: rancangan susunan informasi dan subfitur; belum editor operasional lengkap. Katalog dan kendaraan memperlihatkan contoh tabel referensi.

Peta adalah SVG skematis, bukan peta geografis atau pelacakan GPS nyata. Label pembaruan lokasi memakai waktu simulasi 8 Oktober 2026, 10.24 WIB. Prototipe tidak meminta izin lokasi ponsel.

## Pemetaan tujuan migrasi

| Tujuan lama | Modul baru / fitur |
| --- | --- |
| Beranda Admin | Beranda, tujuh modul tanpa navigasi berulang |
| Persetujuan order | Order / daftar & pemeriksaan |
| Katalog produk dalam alat pengaturan | Order / katalog produk |
| Packing list | Packing & pengiriman / packing list |
| Rute pengiriman | Packing & pengiriman / rute & alokasi |
| Monitor pengiriman | Packing & pengiriman / monitor |
| Master kendaraan dalam alat pengaturan | Packing & pengiriman / kendaraan |
| Master outlet | Outlet / master |
| Persetujuan outlet | Outlet / pengajuan |
| Validasi outlet | Outlet / validasi lokasi |
| Daily Call Monitor | Sales & wilayah / kunjungan |
| Tim & personel | Sales & wilayah / tim & SPV |
| RJP, kluster, jadwal master, PJP harian | Sales & wilayah / wilayah dan jadwal & PJP |
| Siapkan PJP dalam alat pengaturan | Sales & wilayah / jadwal & PJP |
| Peta operasional | Sales & wilayah / peta operasional |
| Antrean perhatian, izin presensi, presensi manual | Tindak lanjut / antrean & pemeriksaan presensi |
| Laporan operasional | Laporan / operasional |
| Laporan registrasi outlet | Laporan / registrasi outlet |
| Laporan absensi dalam alat pengaturan | Laporan / absensi |
| Pengguna dan template hak akses | Sistem / pengguna dan peran & izin |
| Parameter, integrasi, sesi, tampilan, histori konfigurasi | Sistem / parameter dan riwayat |
| Divisi dan penomoran | Sistem / divisi & penomoran |

Registrasi outlet khusus Sales dan peta tugas driver tetap berada dalam konteks peran tersebut. Migrasi menu tidak memberikan izin tambahan. Pengelompokan ini harus tetap memakai pengecekan izin masing-masing fungsi dan server.

## Batas migrasi berikutnya

Pertahankan status order server (menunggu/disetujui/ditolak), penugasan pemeriksa, pengambilalihan Admin dengan alasan, tenggat, revisi dokumen, pencegahan keputusan ganda, validasi pemenuhan parsial, serta seluruh kontrol faktur/pajak/retur yang sudah ada. Validasi prototipe hanya untuk mengevaluasi interaksi dan tidak menggantikan aturan server.

Produk adalah referensi order, bukan stok. Pembayaran dilakukan di luar aplikasi dan catatannya opsional. Tampilan kunjungan harus mempertahankan hubungan Sales, penagihan, order, dan tindak lanjut SPV.

## Pemeriksaan 8 Oktober 2026

- Build aplikasi utama dan build prototipe berhasil.
- Pemeriksaan sumber dan kontrak UI lima peran berhasil. Pemeriksa sumber sekarang menelusuri entry module dari setiap HTML Vite, termasuk entry prototipe.
- Browser: desktop 1440×900, laptop 1366×768 dan 1024×768; reflow mobile 360×800 dan 390×844. Tidak ada overflow halaman pada empat alur utama yang diperiksa setelah perbaikan. Tabel lebar bergulir di wadahnya sendiri.
- Dicoba: pencarian order, setuju, alasan penolakan wajib, order ke packing, validasi karton/faktur, dialog perubahan belum disimpan, review/rilis lokal, pencarian order pulih, alokasi dan urutan rute, sinkronisasi marker/detail, peringatan GPS lama, tanpa lokasi, filter dokumen perjalanan dan kembali ke monitor.
- Empat temuan arsitektur yang sudah ada di luar prototipe masih dilaporkan: variabel tidak terpakai pada `useBackendSync`, `VisitOutcomeInput`, `SupervisorPage`, dan dua komponen dalam `DeliveryTrackingMap`. File prototipe tidak menambah temuan pemeriksa arsitektur.
- Belum diverifikasi: transaksi backend, hak akses melalui login nyata, zoom browser 200%, seluruh skenario koneksi lambat/error, perangkat fisik, GPS ponsel, serta UI lengkap modul selain alur utama. Mobile adalah adaptasi awal untuk menjaga keterpakaian prototipe; evaluasi desktop tetap menjadi dasar migrasi.

Screenshot hasil terdapat dalam direktori visualisasi percakapan: `admin-rebuild-home.png`, `admin-rebuild-order.png`, `admin-rebuild-packing.png`, dan `admin-rebuild-monitor.png`.
