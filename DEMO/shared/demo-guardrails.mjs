export const DEMO_BACKUP_CONFIG_KEY = '_DEMO_POLICY_BACKUP';

export const DEMO_RELAX_GROUPS = {
  geofence: {
    id: 'geofence',
    label: 'Geofence, GPS & Radius',
    description:
      'Menonaktifkan batas radius outlet, wajib GPS perangkat, dan metadata GPS saat uji dari laptop.',
    params: {
      ATTENDANCE_ENFORCE_GEOFENCE: false,
      SPV_ENFORCE_GEOFENCE: false,
      DELIVERY_REQUIRE_GEOFENCE: false,
      SALES_REQUIRE_GPS: false,
      SPV_REQUIRE_GPS: false,
      DELIVERY_REQUIRE_GPS: false,
      OFF_PJP_REQUIRE_GPS: false,
      SHIFT_REQUIRE_GPS: false,
      OUTLET_FIELD_REQUIRE_GPS: false,
      REGISTRATION_REQUIRE_LOCATION: false,
      REGISTRATION_ACTIVATION_REQUIRE_LOCATION: false,
      MASTER_OUTLET_CREATE_REQUIRE_LOCATION: false,
      CUSTOMER_REG_ENFORCE_PLACES_RADIUS: false,
      GPS_REQUIRE_METADATA: false,
    },
  },
  schedule: {
    id: 'schedule',
    label: 'Durasi, Urutan, Shift & Hari Kerja PJP',
    description:
      'Membolehkan check-out instan (0 menit), lompat urutan stop, hari kerja 7 hari/minggu, dan shift opsional.',
    params: {
      ATTENDANCE_ENFORCE_MIN_DURATION: false,
      MINIMUM_VISIT_DURATION_MINUTES: 0,
      ATTENDANCE_ALLOW_EARLY_CHECKOUT: true,
      ATTENDANCE_ENFORCE_SEQUENCE: false,
      ATTENDANCE_REQUIRE_ACTIVE_SHIFT: false,
      SHIFT_ATTENDANCE_MODE: 'OPTIONAL',
      SHIFT_WORKING_DAYS: '0,1,2,3,4,5,6',
      SHIFT_ALLOW_CONTINUE_UNCLOSED: true,
      SHIFT_ALLOW_OPEN_VISITS: true,
      PJP_WORKING_DAYS: '0,1,2,3,4,5,6',
      PJP_FALLBACK_TO_CLUSTER: true,
    },
  },
  evidence: {
    id: 'evidence',
    label: 'Foto Bukti & Unggah Kamera',
    description:
      'Mengizinkan unggah file gambar dari galeri dan menonaktifkan kewajiban foto pada alur cepat.',
    params: {
      CAMERA_INPUT_MODE: 'CAMERA_OR_UPLOAD',
      ATTENDANCE_REQUIRE_PHOTO: false,
      SPV_REQUIRE_PHOTO: false,
      DELIVERY_REQUIRE_PHOTO: false,
      OFF_PJP_REQUIRE_PHOTO: false,
      OUTLET_FIELD_REQUIRE_PHOTO: false,
      CUSTOMER_REG_REQUIRE_PHOTO: false,
      CUSTOMER_REG_REQUIRE_TAX_DOCUMENT: false,
      CLOSED_OUTLET_REQUIRE_PHOTO: false,
      FOLLOW_UP_REQUIRE_EVIDENCE: false,
    },
  },
  workflow: {
    id: 'workflow',
    label: 'Order, Off-PJP & Penutupan Trip',
    description:
      'Membuka order tanpa check-in, off-PJP tanpa batas jendela, dan penyelesaian trip pengiriman tanpa inspeksi fisik.',
    params: {
      ORDER_ALLOW_OUTSIDE_PJP: true,
      ORDER_REQUIRE_CHECKIN: false,
      ORDER_ALLOW_AFTER_VISIT: true,
      ORDER_OUTSIDE_PJP_REQUIRE_REASON: false,
      OFF_PJP_ENABLED: true,
      OFF_PJP_MAX_PER_WINDOW: 0,
      OFF_PJP_MASTER_MIN_DAYS: 0,
      DELIVERY_ALLOW_RESULT_WITHOUT_OUT: true,
      TRIP_REQUIRE_RETURN_INSPECTION: false,
      TRIP_REQUIRE_DOCUMENT_RETURN: false,
      TRIP_BLOCK_OPEN_ISSUES: false,
      SALES_ALLOW_CONTINUE_WITHOUT_OUT: true,
    },
  },
};

export const allDemoRelaxKeys = () => [
  ...new Set(Object.values(DEMO_RELAX_GROUPS).flatMap((group) => Object.keys(group.params))),
];

export function buildDemoRelaxValues(enabledGroupIds = Object.keys(DEMO_RELAX_GROUPS)) {
  const result = {};
  for (const groupId of enabledGroupIds) {
    const group = DEMO_RELAX_GROUPS[groupId];
    if (group) {
      Object.assign(result, group.params);
    }
  }
  return result;
}

export const DEMO_INVARIANT_GUARDRAILS = [
  {
    id: 'LOCAL_ONLY_DB',
    title: 'Blokir Produksi & Database Remote',
    detail:
      'Server demo menolak berjalan pada NODE_ENV=production maupun host database non-lokal (mis. Neon).',
  },
  {
    id: 'REAL_RBAC_SESSION',
    title: 'RBAC & JWT Asli Per Peran',
    detail:
      'Pindah akun selalu menerbitkan JWT asli dengan permission sebenarnya milik akun tujuan (tidak ada eskalasi hak akses).',
  },
  {
    id: 'DATA_INTEGRITY_GUARDS',
    title: 'Validasi Zod, Lock Konkurensi & Anti Self-Approval',
    detail:
      'Skema input, idempotency requestId, dan larangan self-approval tetap aktif demi integritas alur transaksi.',
  },
  {
    id: 'ACTIVE_PJP_PROTECTION',
    title: 'Proteksi PJP Hari Ini yang Sudah Berjalan',
    detail:
      'Rebuild PJP demo ditolak (409) bila stop hari ini sudah memiliki catatan absensi, order, atau status non-PENDING.',
  },
  {
    id: 'REVERSIBLE_POLICY_BACKUP',
    title: 'Backup & Restore Konfigurasi Reversibel',
    detail:
      'Nilai SystemConfig asli disimpan di _DEMO_POLICY_BACKUP sebelum dilonggarkan dan dapat dipulihkan 1 klik.',
  },
];
