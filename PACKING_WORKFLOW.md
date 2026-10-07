# Packing list admin dan alokasi gudang

## Alur default

Admin membuka Kelola Packing List. Tabel referensi order memiliki tab Disetujui, Menunggu persetujuan, dan Ditolak beserta rincian produk. Admin membuat dokumen manual tanpa order atau memakai satu order sebagai referensi. Dokumen terdiri dari toko, baris SKU/nama/satuan/jumlah, karton, berat, faktur, dan catatan.

Draft belum terlihat oleh gudang. Admin dapat mengedit draft; versi dan snapshot perubahan tersimpan. Tombol Kirim ke gudang memerlukan barang, karton positif dan faktur dengan total karton sesuai dokumen. Kepala gudang melihat daftar yang sudah dilepas, lalu menggunakan Kelola Rute Pengiriman untuk memilih kendaraan/supir dan mengalokasikan karton serta jumlah setiap baris barang. Sisa tetap tersedia untuk mobil/rute berikutnya. Supir melihat jumlah muatan bagiannya. Faktur lengkap baru ditandai terkirim ketika total karton dan barang yang diterima memenuhi dokumen, termasuk pengiriman ulang setelah retur.

## Parameter admin

| Parameter | Default | Fungsi |
|---|---|---|
| PACKING_SOURCE_MODE | MANUAL | MANUAL untuk input admin (boleh referensi order), ORDER wajib referensi order, BOTH menyediakan kedua cara |
| PACKING_AUTO_FROM_APPROVED_ORDER | false | Mode ORDER/BOTH membuat draft satu kali pada approval order; tidak mengasumsikan unit produk sebagai karton |
| PACKING_AUTO_RELEASE | false | Dokumen lengkap yang disimpan admin otomatis dilepas |
| PACKING_ALLOW_PENDING_ORDER | false | Izinkan referensi pending dengan alasan override. Ditolak tidak boleh digunakan |
| PACKING_ALLOW_SPLIT | true | Alokasi sebagian ke beberapa kendaraan/rute |
| PACKING_ALLOW_REVISION | true | Penarikan dokumen released untuk revisi sebelum dialokasikan |

Parameter diterapkan backend. Perubahan berlaku pada tindakan berikutnya, bukan membentuk ulang seluruh data lama. Izin override packing tidak mengubah approval order atau laporan penjualan.

## Batas proses yang disengaja

- Satu packing list untuk satu toko; maksimal satu referensi order dan satu dokumen berbasis order yang sama. Beberapa dokumen dapat dimuat dalam satu rute. Barang tambahan manual tetap diperbolehkan admin.
- Faktur dicatat sebagai dokumen referensi. Belum ada impor ERP otomatis.
- Jumlah produk dan karton terpisah. Berat alokasi menggunakan proporsi karton dari berat total; ini estimasi kapasitas, belum penimbangan per baris.
- Setelah dialokasikan, dokumen tidak dapat ditarik. Batalkan rute yang masih draft terlebih dahulu. Setelah pengiriman diproses, hasilnya tidak dapat ditimpa lewat endpoint status biasa. Supir mencatat penolakan penuh/sebagian beserta karton dan barang. Gudang mengonfirmasi penerimaan retur satu kali dengan catatan, lalu jumlah tersebut tersedia lagi untuk pengiriman ulang jika DELIVERY_ALLOW_REDELIVERY aktif. Koreksi hasil final tidak menimpa bukti lama.
- Draft otomatis dari order membutuhkan admin melengkapi kemasan dan faktur. Opsi auto-release tidak melewati validasi kelengkapan.
- Dokumen lama dipertahankan sebagai released dan alokasinya dibackfill; tidak dibuatkan rincian produk fiktif.
- Alur approval hasil manual absensi kini tersedia melalui MANUAL_SALES_REPORT_MODE dan antrean admin/supervisor; dijelaskan di OPERATIONAL_REFACTOR.md.

## Database dan verifikasi

Migrasi additive: server/prisma/migrations/202610060003_packing_workflow/migration.sql. Telah diterapkan melalui prisma db execute pada database lokal; Prisma Client digenerate ulang. Jangan mengeksekusi SQL yang sama dua kali. Proyek belum memiliki baseline Prisma Migrate untuk skema lama.

Pemeriksaan lewat script, tanpa pemeriksaan browser:

- npm test --prefix server: 71 tes lulus.
- node scripts/verify-packing-workflow.mjs dari server: 26 pemeriksaan integrasi pada database lokal, termasuk alokasi bersamaan, pelepasan draft, HTTP/RBAC, pengiriman terpecah dan override. Fixture dihapus dalam finally; konfigurasi operasional tidak diubah.
- npm --prefix client run build berhasil; chunk utama sekitar 221 KB tanpa peringatan 500 KB.
- Prisma validate dan git diff --check berhasil.

Pemeriksaan tambahan verify-operational-workflows.mjs lulus 85 assertion, termasuk penolakan sebagian, penerimaan retur, pengiriman ulang, faktur lengkap dan odometer satu kali. Migrasi tambahan 202610070002_operational_workflows dan 202610070003_attendance_idempotency telah diterapkan pada lokal; prosedur ada di OPERATIONAL_REFACTOR.md.

Rute memakai jarak yang diinput gudang atau hasil penyedia routing, lalu estimasi BBM memakai spesifikasi kendaraan. Jalur mulai dari IN supir juga menyimpan jarak sebelum perjalanan. Jika jarak belum tersedia dan penyedia gagal, rute belum dapat dimulai sampai gudang memasukkan jarak. Posting jarak ke totalKm merupakan jarak rute tercatat/estimasi, bukan pengukuran odometer fisik.
