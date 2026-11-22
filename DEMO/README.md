# Mode Demo Sinar Anugrah (`DEMO/`)

Seluruh kode mode demo diisolasi di folder `DEMO/` tanpa mengubah kode inti `client/src/`, `server/src/`, `shared/`, atau skema database `server/prisma/`.

## Cara Menjalankan

1. Pastikan layanan PostgreSQL lokal berjalan dan database lokal pada `server/.env` sudah termigrasi serta memiliki akun seed/operasional.
2. Jalankan satu perintah dari root repository:

```bash
node DEMO/start-demo.mjs
```

3. Buka browser ke `http://127.0.0.1:5174/`.
4. Klik pil **MODE DEMO** di pojok kanan bawah untuk membuka panel kontrol lintas peran.

## Fitur Utama

- **Pindah Akun Instan 5 Peran (`Admin`, `Supervisor`, `Sales`, `Kepala Gudang`, `Supir`):** Menerbitkan JWT asli milik akun tujuan sehingga halaman, peta, socket notifikasi, dan RBAC langsung aktif tanpa mengetik password berulang.
- **Sync PJP Hari Ini 1-Klik:** Membangun/menyelaraskan jadwal kunjungan Sales dari perubahan Cluster & Rute terbaru.
- **Preset Pelonggaran Constraint Reversibel (`SystemConfig`):**
  - **Geofence, GPS & Radius:** Uji check-in/out, NOO, dan pengantaran dari laptop tanpa GPS lapangan.
  - **Durasi, Urutan, Shift & Hari Kerja PJP:** Check-out instan (`0` menit), lewati urutan stop, hari kerja 7 hari/minggu (`0..6`), dan shift opsional.
  - **Foto Bukti & Unggah Kamera:** Aktifkan upload file (`CAMERA_OR_UPLOAD`) dan longgarkan kewajiban foto.
  - **Order, Off-PJP & Penutupan Trip:** Uji order tanpa check-in, off-PJP bebas batas jendela, dan penutupan trip cepat.
- **Pulihkan Policy Normal 1-Klik:** Nilai asli `SystemConfig` dicadangkan ke `_DEMO_POLICY_BACKUP` sebelum diubah dan bisa dikembalikan kapan saja.

## Guardrail yang Tetap Terkunci

1. **Blokir Produksi & DB Remote:** Server demo menolak start apabila `NODE_ENV=production` atau `DATABASE_URL` bukan host lokal (`localhost`/`127.0.0.1`).
2. **RBAC & JWT Asli Per Peran:** Tidak ada bypass role/permission di endpoint bisnis.
3. **Validasi Zod, Lock Konkurensi & Anti Self-Approval:** Validasi payload, lock transaksi, dan aturan persetujuan antar aktor tetap berjalan.
4. **Proteksi PJP Aktif:** `Sync PJP` menolak (`409`) membangun ulang PJP hari ini jika sudah memiliki absensi, order, atau status non-`PENDING`.
5. **Backup Konfigurasi Reversibel:** Seluruh perubahan `SystemConfig` tercatat di `_DEMO_POLICY_BACKUP`.
