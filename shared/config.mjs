import { CODE_CONFIG_GROUPS } from './coding.mjs';
import { OPERATIONAL_CONFIG_GROUPS } from './operational-policy.mjs';
import {parseAuditItems} from './supervision-checklist.mjs';
import {REPORT_PRESENTATION,reportSelection} from './report-presentation.mjs';
export const CONFIG_DEFINITIONS = [
  ...OPERATIONAL_CONFIG_GROUPS,
  ...CODE_CONFIG_GROUPS,
  {groupKey:'ATTENTION_SLA',groupLabel:'SLA & Eskalasi Pekerjaan',groupDescription:'Batas waktu memakai kalender atau jam kerja WIB sesuai pengaturan SLA sejak pekerjaan masuk tahap. Nol berarti belum aktif. Tenggat eksplisit didahulukan. Perubahan berlaku pada pekerjaan terbuka yang belum mempunyai tenggat eksplisit; riwayat perubahan parameter dicatat.',groupIcon:'LuClock',groupColor:'blue',params:[
    {key:'SLA_ORDER_APPROVAL_HOURS',label:'SLA pemeriksaan order',type:'number',unit:'jam',defaultValue:0,min:0,max:720},
    {key:'SLA_PACKING_DRAFT_HOURS',label:'SLA kelengkapan draft packing',type:'number',unit:'jam',defaultValue:0,min:0,max:720},
    {key:'SLA_PACKING_ALLOCATION_HOURS',label:'SLA alokasi packing siap kirim',type:'number',unit:'jam',defaultValue:0,min:0,max:720},
    {key:'SLA_TRIP_CLOSE_HOURS',label:'SLA penutupan trip setelah kembali',type:'number',unit:'jam',defaultValue:0,min:0,max:720},
    {key:'SLA_VISIT_VALIDATION_HOURS',label:'SLA keputusan pengecualian kunjungan',description:'Validasi luar PJP, hasil manual, pengecualian absensi dan toko tutup/reroute. Tahap admin reroute dimulai saat usulan SPV terakhir disimpan.',type:'number',unit:'jam',defaultValue:0,min:0,max:720},
    {key:'SLA_FOLLOW_UP_REVIEW_HOURS',label:'SLA pemeriksaan hasil tindak lanjut',description:'Dihitung sejak PIC mengirim hasil terbaru, terpisah dari tenggat pengerjaan sales.',type:'number',unit:'jam',defaultValue:0,min:0,max:720},
    {key:'SLA_ESCALATION_DELAY_HOURS',label:'Eskalasi setelah lewat tenggat',description:'Nol menonaktifkan eskalasi. Nilai positif mengirim notifikasi dalam aplikasi ke Admin aktif setelah lewat tenggat ditambah jeda ini. Pemeriksaan setiap 5 menit, satu pemberitahuan per pekerjaan/tahap/tenggat.',type:'number',unit:'jam',defaultValue:0,min:0,max:720},
  ]},
  {groupKey:'NOO',groupLabel:'Registrasi Outlet (NOO)',groupDescription:'Pencarian nama outlet dan kelengkapan pengajuan. Tahap pemeriksaan mengikuti aturan alur registrasi.',groupIcon:'LuBuilding',groupColor:'emerald',params:[
    {key:'CUSTOMER_REG_ENFORCE_PLACES_RADIUS',label:'Batasi pencarian nama outlet dengan radius',description:'Aktif: hasil Google dan OpenStreetMap dibatasi radius pencarian (default 100 meter). Nonaktif: nama outlet dapat dicari di luar radius; GPS fisik pengajuan tetap disimpan.',type:'boolean',defaultValue:true},
    {key:'CUSTOMER_REG_PLACES_RADIUS_METERS',label:'Radius pencarian nama outlet NOO',description:'Batas hasil pencarian dan verifikasi nama outlet saat pembatas radius aktif. Digunakan Google dan OpenStreetMap.',type:'number',unit:'meter',defaultValue:100,min:20,max:1000},
    {key:'CUSTOMER_REG_REQUIRE_PHOTO',label:'Wajib foto outlet NOO',description:'Foto fisik outlet wajib dilampirkan sebelum pengajuan dikirim.',type:'boolean',defaultValue:true},
    {key:'CUSTOMER_REG_REQUIRE_TAX_DOCUMENT',label:'Wajib dokumen KTP / NPWP',description:'NON_PKP memerlukan foto KTP dan PKP memerlukan foto NPWP.',type:'boolean',defaultValue:true},
  ]},
  {groupKey:'SALES_ATTENDANCE',groupLabel:'Aturan Absen Kunjungan Sales',groupDescription:'Aturan absen masuk dan keluar PJP. Persyaratan mengikuti mode kunjungan, bukti GPS, foto, dan aturan durasi yang dipilih.',groupIcon:'LuMapPin',groupColor:'blue',params:[
    {key:'ATTENDANCE_REQUIRE_PHOTO',label:'Aturan foto umum kunjungan Sales',description:'Berlaku jika Foto masuk/keluar memilih Ikuti aturan umum. GPS dan mode presensi diatur terpisah.',type:'boolean',defaultValue:true},
    {key:'ATTENDANCE_ENFORCE_GEOFENCE',label:'Batasi absen dengan radius outlet',description:'Nonaktif: absen masuk/keluar di luar radius diizinkan, penyimpangan GPS tetap ditandai WARNING.',type:'boolean',defaultValue:true},
    {key:'ATTENDANCE_USE_OUTLET_RADIUS',label:'Gunakan radius khusus master outlet',description:'Aktif: radius master outlet didahulukan. Nonaktif: semua absen sales menggunakan Radius Presensi Default.',type:'boolean',defaultValue:true},
    {key:'ATTENDANCE_ENFORCE_SEQUENCE',label:'Wajib mengikuti urutan PJP',description:'Nonaktif: sales bebas memilih urutan toko. Kunjungan aktif tetap harus diselesaikan sebelum membuka toko lain.',type:'boolean',defaultValue:true},
    {key:'ATTENDANCE_ENFORCE_MIN_DURATION',label:'Terapkan durasi minimum kunjungan',description:'Nonaktif: checkout tanpa durasi minimum; durasi aktual tetap dicatat.',type:'boolean',defaultValue:true},
    {key:'ATTENDANCE_ALLOW_EARLY_CHECKOUT',label:'Izinkan checkout dini dengan alasan',description:'Saat durasi minimum aktif: aktif mengizinkan checkout dini dengan alasan; nonaktif mewajibkan menunggu durasi minimum.',type:'boolean',defaultValue:true},
  ]},
  {groupKey:'TEAM_ASSIGNMENT',groupLabel:'Penugasan Tim',groupDescription:'Keanggotaan sales terpisah dari wilayah dan jadwal.',groupIcon:'LuUsers',groupColor:'blue',params:[
    {key:'TEAM_SPV_CAN_CLAIM_UNASSIGNED',label:'Supervisor boleh mengambil sales tanpa tim',description:'Supervisor hanya dapat menambahkan sales yang belum mempunyai supervisor. Transfer antar tim dilakukan admin.',type:'boolean',defaultValue:true},
  ]},
  {groupKey:'MAPS_INTEGRATION',groupLabel:'Integrasi Peta',groupDescription:'Kunci browser dan layanan server dikelola terpisah.',groupIcon:'LuMapPin',groupColor:'blue',params:[
    {key:'MAPS_MAP_ID',label:'Google Maps map ID',description:'Map ID untuk Advanced Marker. Kosong memakai DEMO_MAP_ID untuk pengembangan; isi map ID proyek untuk operasional.',type:'text',defaultValue:''},
    {key:'MAPS_BROWSER_API_KEY',label:'Google Maps browser API key',description:'Dipakai peta pada browser. Batasi domain pada konfigurasi Google; kosong memakai peta alternatif.',type:'text',defaultValue:''},
    {key:'MAPS_API_KEY',label:'Google Maps server API key',description:'Dipakai routing dan validasi pada server. Tidak dikirim ke browser pengguna.',type:'text',defaultValue:''},
  ]},
  { groupKey: 'PACKING_WORKFLOW', groupLabel: 'Alur Packing List', groupDescription: 'Admin menyusun dokumen, gudang mengalokasikan muatan.', groupIcon: 'LuTruck', groupColor: 'blue', params: [
    { key: 'PACKING_SOURCE_MODE', label: 'Sumber packing list', description: 'MANUAL: admin input sendiri dengan referensi order. ORDER: wajib dari order. BOTH: kedua cara tersedia.', type: 'select', defaultValue: 'MANUAL', options: ['MANUAL', 'ORDER', 'BOTH'] },
    { key: 'PACKING_AUTO_FROM_APPROVED_ORDER', label: 'Buat draft otomatis setelah order disetujui', description: 'Berlaku pada mode ORDER/BOTH. Admin tetap melengkapi karton, berat, dan faktur sebelum dokumen siap.', type: 'boolean', defaultValue: false },
    { key: 'PACKING_AUTO_RELEASE', label: 'Kirim otomatis ketika dokumen siap', description: 'Dokumen lengkap yang disimpan admin langsung masuk antrean gudang.', type: 'boolean', defaultValue: false },
    { key: 'PACKING_ALLOW_PENDING_ORDER', label: 'Izinkan referensi order belum disetujui', description: 'Wajib alasan override admin. Tidak mengubah approval order atau nilai penjualan.', type: 'boolean', defaultValue: false },
    { key: 'PACKING_ALLOW_SPLIT', label: 'Izinkan pembagian ke beberapa kendaraan', description: 'Alokasi sebagian produk dan karton; sisa tetap berada di antrean gudang.', type: 'boolean', defaultValue: true },
    { key: 'PACKING_ALLOW_REVISION', label: 'Izinkan penarikan untuk revisi', description: 'Hanya dokumen yang belum dialokasikan. Riwayat perubahan disimpan.', type: 'boolean', defaultValue: true },
  ] },
  { groupKey: "OPERATIONS", groupLabel: "Kebijakan Operasional", groupDescription: "Izin sales, absensi, supervisi, dan shift.", groupIcon: "LuShieldCheck", groupColor: "blue", params: [{"key": "SALES_ALLOW_PRODUCT_CREATE", "label": "Sales boleh menambah produk", "description": "Produk yang dibuat sales masuk katalog bersama.", "type": "boolean", "defaultValue": false},{"key": "ATTENDANCE_ALLOW_MANUAL_SALES", "label": "Input nominal dan SKU saat absen", "description": "Input hasil penjualan opsional saat absen keluar. Tidak membuat pesanan pengiriman.", "type": "boolean", "defaultValue": true},{"key": "MANUAL_SALES_REPORT_MODE", "label": "Perlakuan hasil manual di laporan", "description": "NOTES_ONLY: catatan saja tanpa nominal/SKU. REQUIRE_APPROVAL: wajib disetujui aktor berwenang.", "type": "select", "defaultValue": "NOTES_ONLY", "options": ["NOTES_ONLY", "REQUIRE_APPROVAL"]},{"key": "SALES_ALLOW_PRICE_OVERRIDE", "label": "Sales boleh mengubah harga order", "description": "Jika dimatikan, harga order wajib mengikuti katalog admin.", "type": "boolean", "defaultValue": false},{"key": "OFF_PJP_ENABLED", "label": "Izinkan kunjungan luar PJP", "description": "Sales dapat mengirim kunjungan luar jadwal untuk divalidasi.", "type": "boolean", "defaultValue": true},{"key": "SPV_JOINT_VISIT_LIMIT", "label": "Batas pendampingan SPV per hari", "description": "Batas kunjungan pendampingan per Supervisor per hari ketika pembatasan diaktifkan.", "type": "number", "defaultValue": 4, "min": 1, "max": 100},{"key": "SPV_AUDIT_LIMIT", "label": "Batas audit supervisor", "description": "Batas kunjungan audit per Supervisor per hari ketika pembatasan diaktifkan.", "type": "number", "defaultValue": 3, "min": 1, "max": 100},{"key": "SHIFT_START_TIME", "label": "Jam masuk kerja (WIB)", "description": "Waktu acuan ketepatan jam masuk shift.", "type": "text", "defaultValue": "08:00"},{"key": "DEFAULT_PAYMENT_TYPE", "label": "Pembayaran default order", "description": "Pilihan awal pada form order sales.", "type": "select", "defaultValue": "CASH", "options": ["CASH", "TOP", "TRANSFER"]}] },
  {
    groupKey: 'GEOFENCE',
    groupLabel: 'Geofence & Presensi',
    groupDescription: 'Parameter radius GPS, durasi kunjungan, dan timeout live tracking sales di lapangan.',
    groupIcon: 'LuMapPin',
    groupColor: 'blue',
    params: [
      {key:'SPV_ENFORCE_VISIT_LIMIT',label:'Batasi jumlah kunjungan supervisor per mode',description:'Jika aktif, limit joint/audit ditegakkan di server per hari. Daftar toko tetap dapat dipilih lengkap.',type:'boolean',defaultValue:false},

      {key:'REROUTE_REQUIRE_ADMIN_APPROVAL',label:'Reroute memerlukan persetujuan admin',description:'Nonaktif: keputusan supervisor langsung menambah toko pengganti. Aktif: supervisor mengusulkan lalu admin memutuskan.',type:'boolean',defaultValue:false},

      { key: 'PJP_WORKING_DAYS', label: 'Hari kerja PJP', description: 'Nomor hari dipisahkan koma: 0 Minggu sampai 6 Sabtu. Jadwal historis tetap.', type: 'text', defaultValue: '1,2,3,4,5,6' },
      { key: 'PJP_WEEK_MODE', label: 'Siklus template lama (kompatibilitas)', description: 'Khusus pembacaan template lama. Planner memakai tanggal acuan dan interval 1/2/4 minggu; pengaturan ini tidak mengubah rencana yang diterbitkan.', type: 'select', options: ['ISO_PARITY','MONTH_CYCLE'], defaultValue: 'ISO_PARITY' },
      { key: 'PJP_FALLBACK_TO_CLUSTER', label: 'Fallback generator lama (kompatibilitas)', description: 'Tidak digunakan oleh Planner dan tidak membuat PJP saat halaman dibuka. Jadwal baru harus disusun, ditinjau, dan diterbitkan secara eksplisit.', type: 'boolean', defaultValue: true },
      { key: 'ATTENDANCE_REQUIRE_ACTIVE_SHIFT', label: 'Wajib shift aktif sebelum kunjungan', description: 'Berlaku pada sales dan supervisor. Shift harus belum ditutup.', type: 'boolean', defaultValue: false },
      { key: 'UNLOCK_VALIDITY_MINUTES', label: 'Masa berlaku pengecualian absensi', description: 'Persetujuan berlaku untuk pemohon dan outlet tersebut saja.', type: 'number', min: 5, max: 1440, defaultValue: 120, unit: 'menit' },
      { key: 'ALLOW_CONTINUE_PENDING_CLOSED', label: 'Lanjut saat laporan toko tutup menunggu', description: 'Jika nonaktif, sales menunggu keputusan skip/reroute sebelum lanjut.', type: 'boolean', defaultValue: true },

      {
        key: 'ATTENDANCE_RADIUS_METERS',
        label: 'Radius Presensi Default',
        description: 'Jarak maksimal (meter) dari titik GPS outlet agar sales dapat absen masuk/keluar. Berlaku bila outlet tidak memiliki radius khusus.',
        type: 'number',
        unit: 'meter',
        defaultValue: 50,
        min: 10,
        max: 1000,
      },
      {
        key: 'DEFAULT_OUTLET_RADIUS_METERS',
        label: 'Radius Default Outlet Baru',
        description: 'Nilai radius (meter) yang otomatis diterapkan saat membuat outlet baru di database.',
        type: 'number',
        unit: 'meter',
        defaultValue: 50,
        min: 10,
        max: 500,
      },
      {
        key: 'MINIMUM_VISIT_DURATION_MINUTES',
        label: 'Durasi Kunjungan Minimum',
        description: 'Waktu minimum (menit) yang wajib dipenuhi sales di setiap outlet sebelum bisa checkout. Checkout lebih awal memerlukan alasan.',
        type: 'number',
        unit: 'menit',
        defaultValue: 5,
        min: 1,
        max: 60,
      },
      {
        key: 'LIVE_TRACKING_PING_TIMEOUT_MINUTES',
        label: 'Timeout Ping GPS',
        description: 'Batas waktu (menit) sejak ping GPS terakhir agar sales masih dianggap ONLINE (warna hijau).',
        type: 'number',
        unit: 'menit',
        defaultValue: 15,
        min: 1,
        max: 60,
      },
      {
        key: 'LIVE_TRACKING_ATTENDANCE_TIMEOUT_MINUTES',
        label: 'Timeout Status Absen',
        description: 'Batas waktu (menit) sejak absen terakhir agar lokasi absen masih ditampilkan sebagai lokasi terkini sales.',
        type: 'number',
        unit: 'menit',
        defaultValue: 60,
        min: 15,
        max: 240,
      },
      {
        key: 'LIVE_TRACKING_MAX_BREADCRUMBS',
        label: 'Maksimal Rekam Jejak GPS',
        description: 'Jumlah riwayat titik koordinat (breadcrumbs) pergerakan sales yang disimpan untuk visualisasi jejak rute.',
        type: 'number',
        unit: 'titik',
        defaultValue: 20,
        min: 5,
        max: 100,
      },
      {
        key: 'DEFAULT_OFFICE_LATITUDE',
        label: 'Latitude Kantor Pusat / Gudang',
        description: 'Koordinat lintang (latitude) default kantor atau gudang pusat yang menjadi titik awal tracking/fallback.',
        type: 'number',
        unit: 'derajat',
        defaultValue: -6.884984,
        min: -90,
        max: 90,
      },
      {
        key: 'DEFAULT_OFFICE_LONGITUDE',
        label: 'Longitude Kantor Pusat / Gudang',
        description: 'Koordinat bujur (longitude) default kantor atau gudang pusat yang menjadi titik awal tracking/fallback.',
        type: 'number',
        unit: 'derajat',
        defaultValue: 107.489953,
        min: -180,
        max: 180,
      },
    ],
  },
  {
    groupKey: 'VALIDATION',
    groupLabel: 'Validasi Outlet & Anomali GPS',
    groupDescription: 'Ambang perbandingan bukti peta untuk pemeriksaan opsional outlet. Tidak menentukan persetujuan registrasi.',
    groupIcon: 'LuTarget',
    groupColor: 'amber',
    params: [
      {
        key: 'VALIDATION_DISTANCE_WARNING',
        label: 'Ambang Peringatan (Warning)',
        description: 'Jarak (meter) antara GPS tercatat vs Google Geocode. Melebihi ini akan diberi label WARNING.',
        type: 'number',
        unit: 'meter',
        defaultValue: 200,
        min: 50,
        max: 2000,
      },
      {
        key: 'VALIDATION_DISTANCE_SUSPECT',
        label: 'Ambang Kecurigaan (Suspect)',
        description: 'Jarak (meter) di atas mana koordinat GPS dianggap SUSPECT dan memerlukan audit manual.',
        type: 'number',
        unit: 'meter',
        defaultValue: 500,
        min: 100,
        max: 5000,
      },
      {
        key: 'VALIDATION_NEARBY_RADIUS_METERS',
        label: 'Radius Deteksi Outlet Sekitar',
        description: 'Jarak pencarian outlet sekitar untuk pemeriksaan opsional. Duplikasi registrasi memakai aturan duplikasi tersendiri.',
        type: 'number',
        unit: 'meter',
        defaultValue: 200,
        min: 50,
        max: 1000,
      },
    ],
  },
  {
    groupKey: 'DAILY_CALLS',
    groupLabel: 'Daily Call & Anomali Rute',
    groupDescription: 'Aturan deteksi lonjakan jarak/waktu tempuh dan target panggilan kunjungan sales harian.',
    groupIcon: 'LuPhoneCall',
    groupColor: 'indigo',
    params: [
      {
        key: 'DAILY_CALL_TARGET_CALLS',
        label: 'Target Kunjungan Harian',
        description: 'Standar jumlah outlet yang harus dikunjungi setiap sales per hari kerja.',
        type: 'number',
        unit: 'outlet',
        defaultValue: 10,
        min: 1,
        max: 50,
      },
      {
        key: 'TRAVEL_GAP_SHORT_KM',
        label: 'Batas Jarak Dekat Anomali',
        description: 'Jarak tempuh (km) untuk deteksi waktu tempuh tidak wajar rute pendek.',
        type: 'number',
        unit: 'km',
        defaultValue: 3,
        min: 1,
        max: 20,
      },
      {
        key: 'TRAVEL_GAP_SHORT_MINUTES',
        label: 'Batas Waktu Tempuh Jarak Dekat',
        description: 'Waktu tempuh (menit) maksimal untuk jarak dekat sebelum dikategorikan anomali perjalanan lambat.',
        type: 'number',
        unit: 'menit',
        defaultValue: 45,
        min: 10,
        max: 180,
      },
      {
        key: 'TRAVEL_GAP_MED_KM',
        label: 'Batas Jarak Menengah Anomali',
        description: 'Jarak tempuh (km) untuk deteksi perjalanan rute menengah antar toko.',
        type: 'number',
        unit: 'km',
        defaultValue: 8,
        min: 2,
        max: 50,
      },
      {
        key: 'TRAVEL_GAP_MED_MINUTES',
        label: 'Batas Waktu Tempuh Jarak Menengah',
        description: 'Waktu tempuh (menit) maksimal untuk jarak menengah sebelum dicatat sebagai anomali.',
        type: 'number',
        unit: 'menit',
        defaultValue: 90,
        min: 20,
        max: 300,
      },
    ],
  },
  {
    groupKey: 'TRANSAKSI',
    groupLabel: 'Transaksi & Keuangan',
    groupDescription: 'Ketentuan perpajakan, termin pembayaran (TOP), dan target omzet penjualan.',
    groupIcon: 'LuCreditCard',
    groupColor: 'purple',
    params: [
      { key: 'SALES_WEEKLY_TARGET_AMOUNT', label: 'Acuan target mingguan', description: 'Acuan umum; tidak menetapkan target laporan otomatis. Tetapkan target sales/periode pada laporan mingguan.', type: 'number', defaultValue: 25000000, min: 0, max: 10000000000, unit: 'Rp' },
      {
        key: 'TAX_RATE_PERCENT',
        label: 'Persentase PPN',
        description: 'Besaran tarif Pajak Pertambahan Nilai (%) yang diterapkan pada kalkulasi faktur dan invoice.',
        type: 'number',
        unit: '%',
        defaultValue: 11,
        min: 0,
        max: 100,
      },
      {
        key: 'DEFAULT_TERM_OF_PAYMENT_DAYS',
        label: 'Termin Pembayaran Default (TOP)',
        description: 'Jumlah hari jatuh tempo pembayaran kredit default saat pembuatan order baru.',
        type: 'number',
        unit: 'hari',
        defaultValue: 30,
        min: 0,
        max: 180,
      },
      {
        key: 'SALES_MONTHLY_TARGET_AMOUNT',
        label: 'Acuan Target Bulanan',
        description: 'Acuan umum; tidak menetapkan target laporan otomatis. Tetapkan target sales/periode pada laporan MTD.',
        type: 'number',
        unit: 'Rp',
        defaultValue: 100000000,
        min: 1000000,
        max: 10000000000,
      },
      {
        key: 'SALES_BASELINE_LMA_AMOUNT',
        label: 'Baseline LMA Sales',
        description: 'Parameter lama untuk kompatibilitas. Laporan MTD memakai transaksi bulan lalu yang sebenarnya, tanpa pengganti nominal rekaan.',
        type: 'number',
        unit: 'Rp',
        defaultValue: 0,
        min: 0,
        max: 10000000000,
      },
    ],
  },
  {
    groupKey: 'DIVISI',
    groupLabel: 'Divisi & Cabang',
    groupDescription: 'Konfigurasi divisi aktif, cabang default, dan radius pencarian lokasi registrasi toko.',
    groupIcon: 'LuBuilding',
    groupColor: 'emerald',
    params: [
      {
        key: 'ACTIVE_DIVISION',
        label: 'Divisi Aktif',
        description: 'Divisi utama yang ditampilkan pada laporan registrasi outlet dan formulir pendaftaran customer baru.',
        type: 'select',
        options: ['BELFOODS', 'UNICHARM', 'GENERAL'],
        defaultValue: 'BELFOODS',
      },
      {
        key: 'DEFAULT_BRANCH',
        label: 'Cabang Default',
        description: 'Nama cabang distribusi yang menjadi default pada formulir pendaftaran customer baru.',
        type: 'text',
        defaultValue: 'PADALARANG',
      },
      {
        key: 'COMPANY_NAME',
        label: 'Nama Perusahaan',
        description: 'Nama perusahaan yang tampil di header laporan dan notifikasi sistem.',
        type: 'text',
        defaultValue: 'PT. SINAR ANUGRAH',
      },
    ],
  },
  {
    groupKey: 'LOGISTIK',
    groupLabel: 'Logistik & Pengiriman',
    groupDescription: 'Parameter operasional logistik, bahan bakar, dan kapasitas kendaraan pengiriman armada.',
    groupIcon: 'LuTruck',
    groupColor: 'violet',
    params: [
      {key:'DELIVERY_REQUIRE_PHOTO',label:'Wajib bukti foto pengiriman',description:'Foto wajib pada absensi supir dan hasil pengiriman.',type:'boolean',defaultValue:true},
      {key:'DELIVERY_REQUIRE_GEOFENCE',label:'Batasi absensi supir dengan radius toko',description:'Berlaku saat bukti presensi tujuan diwajibkan. Memerlukan GPS; radius mengikuti master outlet.',type:'boolean',defaultValue:false},
      {key:'DELIVERY_ALLOW_REDELIVERY',label:'Izinkan pengiriman ulang barang retur',description:'Sisa barang dapat dialokasikan kembali hanya setelah gudang mengonfirmasi penerimaan retur.',type:'boolean',defaultValue:true},
      {key:'ORDER_PRICES_INCLUDE_TAX',label:'Harga produk sudah termasuk pajak',description:'Aktif: nominal order tetap harga katalog, komponen pajak dicatat. Nonaktif: pajak parameter ditambahkan ke nominal.',type:'boolean',defaultValue:true},

      { key: 'OIL_FILTER_CHANGE_INTERVAL_KM', label: 'Interval filter oli', description: 'Jarak servis filter oli armada.', type: 'number', defaultValue: 10000, min: 100, max: 100000, unit: 'km' },
      { key: 'BRAKE_CHANGE_INTERVAL_KM', label: 'Interval kanvas rem', description: 'Jarak servis kanvas rem armada.', type: 'number', defaultValue: 20000, min: 100, max: 200000, unit: 'km' },
      { key: 'LOGISTICS_PRICE_PER_CARTON', label: 'Nilai rata-rata per karton', description: 'Untuk estimasi margin pengiriman.', type: 'number', defaultValue: 0, min: 0, max: 100000000, unit: 'Rp' },
      { key: 'LOGISTICS_MARGIN_PERCENT', label: 'Margin kotor pengiriman', description: 'Untuk estimasi titik impas pengiriman.', type: 'number', defaultValue: 0, min: 0, max: 100, unit: '%' },
      { key: 'LOGISTICS_BASE_DROP_COST', label: 'Biaya per titik pengiriman', description: 'Biaya dasar untuk setiap toko tujuan.', type: 'number', defaultValue: 0, min: 0, max: 100000000, unit: 'Rp' },

      {
        key: 'DEFAULT_FUEL_PRICE_PER_LITER',
        label: 'Harga BBM per Liter',
        description: 'Harga bahan bakar (Rp) per liter untuk kalkulasi biaya pengiriman armada.',
        type: 'number',
        unit: 'Rp',
        defaultValue: 12500,
        min: 5000,
        max: 50000,
      },
      {
        key: 'DEFAULT_VEHICLE_CAPACITY_CARTONS',
        label: 'Kapasitas Kendaraan Default',
        description: 'Jumlah karton maksimum yang dapat dimuat per kendaraan pengiriman default.',
        type: 'number',
        unit: 'karton',
        defaultValue: 200,
        min: 10,
        max: 2000,
      },
      {
        key: 'OIL_CHANGE_INTERVAL_KM',
        label: 'Interval Ganti Oli',
        description: 'Jarak tempuh (km) kendaraan sebelum harus ganti oli berikutnya.',
        type: 'number',
        unit: 'km',
        defaultValue: 5000,
        min: 1000,
        max: 20000,
      },
    ],
  },
  {
    groupKey: 'SESI',
    groupLabel: 'Sesi & Keamanan',
    groupDescription: 'Pengaturan durasi sesi login, expiry token JWT, whitelist akun testing, dan notifikasi.',
    groupIcon: 'LuKey',
    groupColor: 'rose',
    params: [
      {
        key: 'JWT_EXPIRES_IN',
        label: 'Durasi Token Akses',
        description: 'Berapa lama token login aktif sebelum harus login ulang (contoh: 1d = 1 hari, 12h = 12 jam).',
        type: 'text',
        defaultValue: '1d',
      },
      {
        key: 'JWT_REFRESH_EXPIRES_IN',
        label: 'Durasi Refresh Token',
        description: 'Berapa lama refresh token berlaku untuk memperpanjang sesi (contoh: 7d = 7 hari).',
        type: 'text',
        defaultValue: '7d',
      },
      {
        key: 'BYPASS_GEOFENCE_EMAILS',
        label: 'Email Bypass Geofence',
        description: 'Daftar email akun testing yang boleh absen di luar radius (pisahkan dengan koma).',
        type: 'text',
        defaultValue: '',
      },
      {
        key: 'NOTIFICATIONS_LIMIT_PER_USER',
        label: 'Notifikasi per halaman',
        description: 'Jumlah notifikasi yang dimuat sekali pada panel pengguna. Tidak menghapus atau membatasi penyimpanan riwayat.',
        type: 'number',
        unit: 'pesan',
        defaultValue: 50,
        min: 10,
        max: 500,
      },
    ],
  },
  {
    groupKey: 'TAMPILAN',
    groupLabel: 'Kustomisasi Tampilan',
    groupDescription: 'Parameter konfigurasi legenda, label, dan tampilan antarmuka pada modul sales.',
    groupIcon: 'LuGlobe',
    groupColor: 'cyan',
    params: [
      {
        key: 'CALLPLAN_LEGEND',
        label: 'Legenda Callplan/PJP',
        description: 'Teks legenda yang ditampilkan pada kartu ringkasan rute harian sales di halaman RJP.',
        type: 'text',
        defaultValue: 'F4 = Kunjungan 4 minggu, F2 = Kunjungan 2 minggu',
      },

    ],
  },
];

export const LEGACY_CONFIG_KEYS=['SALES_WEEKLY_TARGET_AMOUNT','SALES_MONTHLY_TARGET_AMOUNT','SALES_BASELINE_LMA_AMOUNT','DEFAULT_PRODUCT_STOCK','VALIDATION_CONFIDENCE_THRESHOLD_HIGH','VALIDATION_CONFIDENCE_THRESHOLD_MEDIUM','VALIDATION_CONFIDENCE_THRESHOLD_LOW','LIVE_TRACKING_ATTENDANCE_TIMEOUT_MINUTES','CALLPLAN_LEGEND'];
for(const group of CONFIG_DEFINITIONS)group.params=group.params.filter(param=>!LEGACY_CONFIG_KEYS.includes(param.key));
for(let index=CONFIG_DEFINITIONS.length-1;index>=0;index--)if(!CONFIG_DEFINITIONS[index].params.length)CONFIG_DEFINITIONS.splice(index,1);
export const CONFIG_PARAMS = CONFIG_DEFINITIONS.flatMap(group => group.params);
export const CONFIG_DEFAULTS = Object.fromEntries(CONFIG_PARAMS.map(param => [param.key, param.defaultValue]));
export function parseConfigValue(param, raw) {
  if(Object.hasOwn(REPORT_PRESENTATION,param.key))return reportSelection(param.key,raw).join(',');
  if(param.type==='checklist')return parseAuditItems(raw);
  if (param.type === 'boolean') {
    if (![true, false, 'true', 'false'].includes(raw)) throw new Error(`${param.label}: pilih aktif atau nonaktif`);
    return raw === true || raw === 'true';
  }
  if (param.type === 'number') {
    const value = Number(raw);
    if (raw === '' || raw === null || !Number.isFinite(value) || value < param.min || value > param.max) throw new Error(`${param.label}: masukkan angka ${param.min} sampai ${param.max}`);
    if (!['DEFAULT_OFFICE_LATITUDE', 'DEFAULT_OFFICE_LONGITUDE', 'TAX_RATE_PERCENT', 'TRAVEL_GAP_SHORT_KM', 'TRAVEL_GAP_MED_KM'].includes(param.key) && !Number.isInteger(value)) throw new Error(`${param.label}: gunakan bilangan bulat`);
    return value;
  }
  if (typeof raw !== 'string' || raw.length > 2000) throw new Error(`${param.label}: teks tidak valid`);
  if (param.options && !param.options.includes(raw)) throw new Error(`${param.label}: pilihan tidak valid`);
  if (['PJP_WORKING_DAYS','SLA_WORKING_DAYS'].includes(param.key) && !/^[0-6](,[0-6])*$/.test(raw)) throw new Error('Hari kerja harus daftar 0–6 dipisahkan koma');
  if (['SHIFT_START_TIME','SHIFT_DAY_CUTOFF_TIME','SLA_WORK_START','SLA_WORK_END'].includes(param.key) && !/^([01]\d|2[0-3]):[0-5]\d$/.test(raw)) throw new Error('Jam masuk harus HH:mm');
  if(param.key==='SLA_HOLIDAYS'&&raw.split(',').filter(Boolean).some(day=>!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day+'T00:00:00Z'))||new Date(day+'T00:00:00Z').toISOString().slice(0,10)!==day))throw new Error('Tanggal libur harus YYYY-MM-DD valid dipisahkan koma');
  if (param.key.startsWith('JWT_') && !/^[1-9]\d*[smhd]$/.test(raw)) throw new Error('Durasi token harus seperti 12h atau 7d');
  return raw;
}
