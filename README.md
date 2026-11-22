# Sinar Anugrah — Sales Tracking, Route Optimization & Distribution System

Sistem operasional distribusi terpadu berbasis web untuk mengelola perencanaan kunjungan penjualan (PJP), pelacakan lapangan real-time, registrasi outlet baru (NOO), pemesanan, pengemasan gudang, pengiriman armada, serta pelaporan manajerial multi-peran (**Admin**, **Supervisor**, **Sales**, **Kepala Gudang**, dan **Supir**).

---

## Fitur Utama & Alur Operasional

- **Autentikasi, Keamanan & RBAC 5 Peran**
  - Sesi berbasis JWT (`Access Token` + `Refresh Token` melalui cookie `HttpOnly` dengan fallback body), rate limiter berbasis IP + akun, Helmet CSP, korelasi request (`X-Request-Id`), serta matriks izin granular (`D1 User` & `RoleTemplate`).
- **Manajemen Wilayah, Cluster & Optimasi Rute (`2-Opt`)**
  - Pembentukan cluster otomatis maupun manual, jadwal kunjungan mingguan, penugasan Sales per cluster, serta pengurutan rute stop dengan `optimize2Opt` dan integrasi Google Maps / Places dengan fallback otomatis ke OSRM dan Leaflet.
- **Perencanaan & Sinkronisasi PJP**
  - Dukungan jadwal mingguan (`PjpPlan`) terbitan Supervisor serta pembentukan daftar kunjungan harian otomatis (`ensureSalesPjpForDate`) dari jadwal cluster dan rute aktif.
- **Presensi & Eksekusi Kunjungan Lapangan**
  - Check-In / Check-Out outlet dengan validasi geofence dinamis, durasi minimum, penegakan urutan stop, kunjungan di luar PJP (*Off-PJP*), pelaporan toko tutup (*Closed Store*), serta alur pengajuan & persetujuan *Unlock Request*.
- **Registrasi Outlet Baru (NOO) & Validasi Master Outlet**
  - Pengajuan NOO lengkap dengan lampiran dokumen pajak (KTP/NPWP), foto fisik toko, deteksi duplikat, persetujuan bertingkat (*Sales → Supervisor → Admin*), finalisasi menjadi Outlet aktif, dan antrean validasi koordinat Google Places.
- **Siklus Order, Gudang & Pengiriman Supir**
  - Katalog produk dan penetapan harga, pembuatan order lapangan, persetujuan berjenjang, penyusunan & rilis *Packing List* serta *Invoice*, penugasan rute pengiriman Supir, pencatatan absensi tujuan/bukti serah terima/retur barang, hingga penutupan trip & rekonsiliasi faktur.
- **Armada & Pemeliharaan Kendaraan**
  - Pemantauan kapasitas muatan, ledger kilometer rencana vs aktual (*odometer*), pencatatan servis multi-item beserta foto struk bengkel, dan pengingat jadwal servis berkala.
- **Pelaporan Manajerial, Audit & Notifikasi Real-Time**
  - Laporan *Daily Call*, *Weekly (WTD)*, *Monthly (MTD)*, *Absensi Janggal*, dan *Registrasi Outlet* lengkap dengan ekspor 5 format (**DOCX, XLSX, CSV, TXT, PDF**), antrean *Attention Center*, histori audit, serta siaran notifikasi & pelacakan GPS langsung melalui Socket.IO + SSE.

---

## Struktur Monorepo

```text
SINAR ANUGRAH/
├── client/                         # Frontend React 18 + Vite 7 + Tailwind CSS v4
│   ├── src/
│   │   ├── app/                    # Router, overlay peta, fallback role workspace
│   │   ├── constants/              # Tab ID, izin navigasi, menu per peran
│   │   ├── context/                # AppContext, MapContext, MapDataContext & hooks sync
│   │   ├── pages/                  # Halaman per domain (Sales, Supervisor, Admin, Warehouse, Driver, Reports)
│   │   ├── services/               # httpClient & wrapper API per modul
│   │   ├── shared/                 # Komponen UI reusable (NativeDialog, GuardedDialog, ToastRegion, DataTable)
│   │   ├── styles/                 # Design token Light Mode (#0869cf) & CSS ter-layer
│   │   └── utils/                  # Generator ekspor DOCX/XLSX/CSV/TXT/PDF & helper frontend
│   ├── scripts/
│   │   └── audit-components.mjs    # Verifikasi arsitektur komponen React (AST)
│   └── vite.config.js
│
├── server/                         # Backend Express REST API + Prisma ORM + Socket.IO
│   ├── prisma/
│   │   ├── schema.prisma           # Skema PostgreSQL (tabel inti & pendukung)
│   │   ├── migrations/             # Riwayat migrasi Prisma resmi
│   │   ├── migrations_staging/     # Skrip SQL gladi resik staging (mis. DB-03 NUMERIC(18,2))
│   │   ├── seed.js                 # Seeder awal sistem
│   │   ├── deployReleaseMigrations.mjs
│   │   └── migrateEvidenceToDisk.mjs
│   ├── scripts/                    # Skrip audit source, kontrak UI, ekspor & workflow
│   ├── src/
│   │   ├── config/                 # env, database failover (online/offline), prisma, socket, adapter
│   │   ├── middlewares/            # Autentikasi, otorisasi, domain-permission, validasi Zod, error handler
│   │   ├── modules/                # Modul bisnis modular (auth, absensi, pjp, orders, outlets, delivery, dll.)
│   │   ├── routes/                 # Agregasi API v1, health/readiness, evidence disk streaming
│   │   └── utils/                  # Scheduler, money serializer, evidence disk storage, gps, response
│   ├── tests/                      # Unit tests (node:test), integration tests & policy verifier
│   └── .env.example
│
├── shared/                         # Single Source of Truth lintas frontend-backend (*.mjs)
├── DEMO/                           # Mode Demo terisolasi untuk uji alur lintas peran
│   ├── client/                     # Entry Vite + panel DemoDock (Pindah Akun, Skenario, Constraint)
│   ├── server/                     # Wrapper Express + guard lokal-only + helper Sync PJP
│   ├── shared/                     # Preset pelonggaran constraint & guardrail tetap
│   ├── tests/                      # Unit test mode demo
│   ├── README.md
│   └── start-demo.mjs              # Launcher 1 perintah mode demo
│
├── .prettierrc                     # Konfigurasi pemformatan kode standar
├── .prettierignore
├── package.json                    # Script orkestrasi monorepo root
└── README.md
```

---

## Tech Stack

| Lapisan | Teknologi |
| :--- | :--- |
| **Frontend** | React 18, Vite 7, Tailwind CSS v4, Leaflet / React-Leaflet, `@react-google-maps/api` |
| **Backend** | Node.js (ESM), Express 4, Zod, Socket.IO, `node-cron`, `express-rate-limit`, Helmet |
| **Database & ORM** | PostgreSQL 15+, Prisma ORM 5 (`@prisma/client`), `pg`, `@socket.io/postgres-adapter` |
| **Ekspor Dokumen** | `exceljs` (XLSX), `docx` (DOCX), `jspdf` + `jspdf-autotable` (PDF), CSV & TXT terstandar |
| **Pengujian & Mutu** | `node --test`, Esbuild harness, Babel AST verifier, Prettier |

---

## Prasyarat & Instalasi

### Prasyarat
- **Node.js** `>= 20.19` atau `>= 22.12` (teruji pada Node.js `v24.x`)
- **PostgreSQL** `15+` aktif di lokal maupun server database target

### Langkah Setup
1. **Install seluruh dependensi monorepo (`root`, `server`, `client`):**
   ```bash
   npm run install:all
   ```

2. **Konfigurasi Environment Backend:**
   Salin `server/.env.example` menjadi `server/.env` dan sesuaikan kredensial serta secret minimal 32 karakter untuk mode produksi:
   ```bash
   cp server/.env.example server/.env
   ```

3. **Siapkan Database & Migrasi Prisma:**
   ```bash
   npx prisma generate --schema=server/prisma/schema.prisma
   npx prisma migrate deploy --schema=server/prisma/schema.prisma
   npm run prisma:seed --prefix server
   ```

---

## Menjalankan Aplikasi

### 1. Mode Development Reguler
Menjalankan backend (`http://localhost:5000`) dan frontend Vite (`http://localhost:5173`) secara bersamaan:
```bash
npm run dev
```

### 2. Mode Database Lokal & Failover Otomatis Saat Offline
Backend dilengkapi modul resolusi database pada `server/src/config/database.js`:
- **`DB_MODE=auto`** *(default)*: Jika `DATABASE_URL` menunjuk ke database remote (mis. Neon), server mengecek jangkauan TCP saat startup (`DB_FALLBACK_TIMEOUT_MS`, default `2500` ms). Saat koneksi internet/remote tidak tersedia, backend **otomatis beralih ke PostgreSQL lokal** menggunakan `LOCAL_DATABASE_URL` atau `DATABASE_URL` lokal di `server/.env`.
- **Mode Lokal Eksplisit (tanpa probe remote):**
  ```bash
  npm run dev:local --prefix server
  # atau untuk dijalankan langsung:
  npm run start:local --prefix server
  ```
- Status koneksi aktif (`databaseMode` dan `databaseTarget` tanpa kredensial) dapat dipantau melalui endpoint `GET /api/v1/health/ready` dan `GET /api/v1/health/monitoring`.

### 3. Mode Demo Uji Alur Lintas Peran (`DEMO/`)
Untuk menguji alur end-to-end antar peran (membuat cluster lalu langsung mengecek jadwal sebagai Sales, mengajukan NOO lalu menyetujui sebagai Supervisor/Admin, Order → Gudang → Supir) **tanpa hambatan constraint lapangan saat uji di komputer lokal**:
```bash
node DEMO/start-demo.mjs
```
- **Frontend Demo:** `http://127.0.0.1:5174/` (klik pil **`MODE DEMO`** di pojok kanan bawah).
- **Backend Demo:** `http://127.0.0.1:5050/api/demo/status`.
- Menyediakan fitur pindah akun instan 5 peran dengan JWT asli, tombol **Sync PJP** 1-klik, pelonggaran preset `SystemConfig` reversibel (`_DEMO_POLICY_BACKUP`), serta guardrail keras menolak startup di `NODE_ENV=production` maupun database remote. Detail lengkap tersedia di [`DEMO/README.md`](./DEMO/README.md).

---

## Penyimpanan Bukti Foto, Skrip Staging & Operasional

- **Evidence Storage (`DB-01`):** Secara default bukti gambar disimpan kompatibel dalam skema aktif; set `EVIDENCE_STORAGE_MODE=DISK` untuk menyimpan upload gambar (`noo`, `attendance`, `off-pjp`, `delivery`, `vehicle`) ke direktori disk terproteksi dan melayani file via endpoint terautentikasi `GET /api/v1/evidence/:domain/:ym/:filename`.
  - Dry-run migrasi foto historis ke disk:
    ```bash
    node server/prisma/migrateEvidenceToDisk.mjs
    ```
  - Eksekusi penulisan migrasi historis:
    ```bash
    node server/prisma/migrateEvidenceToDisk.mjs --apply
    ```
- **Gladi Resik Presisi Finansial (`DB-03`):** Skrip SQL idempoten `server/prisma/migrations_staging/db03_money_decimal_18_2.sql` disiapkan untuk mengonversi 11 kolom moneter dari `Float` ke `NUMERIC(18,2)` pada lingkungan staging bersama pembaruan `schema.prisma` dan serialisasi angka di `server/src/utils/response.js`.
- **Verifikasi Integritas Migrasi Rilis:**
  ```bash
  node server/prisma/deployReleaseMigrations.mjs
  ```

---

## Pengujian & Verifikasi Kualitas

Perintah utama untuk memvalidasi logika bisnis, kontrak API/UI, arsitektur komponen, ekspor dokumen, dan build produksi:

```bash
# Unit tests backend & domain shared
npm test --prefix server

# Unit tests Mode Demo terisolasi
node --test DEMO/tests/demo-mode.test.mjs

# Build produksi frontend
npm run build --prefix client

# Pemeriksaan statis & arsitektur (offline)
node server/scripts/verify-source.mjs
node client/scripts/audit-components.mjs
node server/tests/verify-policy-coverage.mjs
node server/tests/verify-operation-surfaces.mjs
node server/tests/verify-ui-semantics.mjs
node server/scripts/verify-ui-contracts.mjs
node server/scripts/verify-dialog-guard.mjs
node server/scripts/verify-all-document-exports.mjs
node server/scripts/verify-frontend-exports.mjs
```

Skrip pengujian integrasi terhadap PostgreSQL aktif tersedia pada `server/package.json` (`verify:operational`, `verify:packing`, `verify:order-integrity`, `verify:delivery-control`, `verify:pjp-planning`, dan suite `server/tests/*.integration.mjs`).
