/**
 * roles.constants.js
 * Single Responsibility: Master registry of all system permissions, categories,
 * and built-in role templates.
 */

export const ALL_PERMISSIONS = [
  // 1. Dashboard & Monitoring
  {
    key: 'can_view_dashboard',
    label: 'Peta Monitoring Umum',
    desc: 'Akses peta distribusi toko dan status operasional',
    category: 'Dashboard & Monitoring',
  },
  {
    key: 'can_view_live_tracking',
    label: 'Live GPS Tracking Sales',
    desc: 'Pantau posisi dan jejak pergerakan realtime tim sales di lapangan',
    category: 'Dashboard & Monitoring',
  },
  {
    key: 'can_view_daily_call',
    label: 'Daily Call Monitor',
    desc: 'Akses monitoring panggilan harian dan rekap absensi tim',
    category: 'Dashboard & Monitoring',
  },

  // 2. RJP & Jadwal Kunjungan
  {
    key: 'can_access_rjp',
    label: 'Jadwal & RJP Kunjungan',
    desc: 'Akses jadwal Master RJP toko dan check-in kunjungan lapangan',
    category: 'RJP & Jadwal Sales',
  },
  {
    key: 'can_manage_rjp',
    label: 'Kelola Master RJP',
    desc: 'Boleh menyusun, mengedit, dan menetapkan rute PJP untuk sales',
    category: 'RJP & Jadwal Sales',
  },
  {
    key: 'can_request_reroute',
    label: 'Pengajuan Reroute & Skip',
    desc: 'Boleh mengajukan permohonan reroute toko atau skip kunjungan',
    category: 'RJP & Jadwal Sales',
  },

  // 3. Master Outlet & NOO
  {
    key: 'can_register_outlet',
    label: 'Registrasi Outlet (NOO)',
    desc: 'Boleh mendaftarkan calon pelanggan/toko baru (NOO) di lapangan',
    category: 'Master Outlet & NOO',
  },
  {
    key: 'can_approve_outlet',
    label: 'Persetujuan Outlet (NOO)',
    desc: 'Boleh menyetujui verifikasi pendaftaran outlet baru (SPV/Admin)',
    category: 'Master Outlet & NOO',
  },
  {
    key: 'can_manage_outlets',
    label: 'Master Database Outlet',
    desc: 'Kelola database toko, ubah informasi kontak, lokasi, dan penugasan',
    category: 'Master Outlet & NOO',
  },
  {
    key: 'can_validate_outlet',
    label: 'Validasi Koordinat GPS',
    desc: 'Boleh memperbaiki, menguji toleransi jarak, dan mengunci koordinat GPS toko',
    category: 'Master Outlet & NOO',
  },
  {
    key: 'can_view_outlet_report',
    label: 'Laporan Registrasi NOO',
    desc: 'Melihat rekap data, statistik, dan status registrasi outlet',
    category: 'Master Outlet & NOO',
  },

  // 4. Transaksi & Approval
  {
    key: 'can_create_order',
    label: 'Pembuatan Order (PO)',
    desc: 'Input pesanan barang / Purchase Order langsung dari toko',
    category: 'Transaksi & Approval',
  },
  {
    key: 'can_approve_order',
    label: 'Persetujuan Order (PO)',
    desc: 'Boleh memutuskan pengajuan order sesuai lingkup tim',
    category: 'Transaksi & Approval',
  },
  {
    key: 'can_unlock_absensi',
    label: 'Buka Kunci Absensi Radius',
    desc: 'Boleh menyetujui permohonan buka kunci absensi di luar radius GPS',
    category: 'Transaksi & Approval',
  },

  // 5. Gudang & Logistik
  {
    key: 'can_manage_delivery',
    label: 'Akses Logistik Penuh',
    desc: 'Akses menu logistik, packing list, rute supir, dan monitor gudang',
    category: 'Gudang & Logistik',
  },
  {
    key: 'can_manage_packing_list',
    label: 'Kelola Packing List',
    desc: 'Boleh membuat, memilah pesanan, dan mencetak packing list gudang',
    category: 'Gudang & Logistik',
  },
  {
    key: 'can_manage_delivery_routes',
    label: 'Atur Rute Pengiriman',
    desc: 'Menyusun rute pengiriman harian dan menugaskan armada ke supir',
    category: 'Gudang & Logistik',
  },
  {
    key: 'can_monitor_delivery',
    label: 'Monitor Pengiriman Realtime',
    desc: 'Memantau status pengiriman barang dan laporan kendala antaran',
    category: 'Gudang & Logistik',
  },
  {
    key: 'can_access_driver_map',
    label: 'Peta Navigasi Supir',
    desc: 'Akses navigasi rute pengantaran, bukti serah terima toko, dan tanda tangan',
    category: 'Gudang & Logistik',
  },

  // 6. Tim & Master Wilayah
  {
    key: 'can_view_team',
    label: 'Tim & Personel',
    desc: 'Akses data personel lapangan, sales bawahan, dan status kehadiran',
    category: 'Tim & Master Wilayah',
  },
  {
    key: 'can_manage_clusters',
    label: 'Kelola Master Kluster',
    desc: 'Membuat kluster wilayah baru, menggambar batas area, dan assign sales',
    category: 'Tim & Master Wilayah',
  },

  // 7. Laporan & Analitik
  {
    key: 'can_view_reports',
    label: 'Laporan Distribusi ND6',
    desc: 'Melihat laporan penjualan, pencapaian target, dan performa distribusi',
    category: 'Laporan & Analitik',
  },
  {
    key: 'can_export_reports',
    label: 'Ekspor Laporan',
    desc: 'Mengunduh laporan analitik ke format Microsoft Excel atau PDF',
    category: 'Laporan & Analitik',
  },

  // 8. Sistem & Administrasi
  {
    key: 'can_manage_system_config',
    label: 'Pengaturan Sistem',
    desc: 'Mengubah parameter global sistem (radius GPS, SLA rute, toleransi waktu)',
    category: 'Sistem & Administrasi',
  },
  {
    key: 'can_manage_users',
    label: 'Manajemen Pengguna',
    desc: 'Kelola akun pengguna, reset password, dan konfigurasi profil user',
    category: 'Sistem & Administrasi',
  },
  {
    key: 'can_manage_roles',
    label: 'Kelola Role & Template',
    desc: 'Menambah role kustom baru dan mengatur template hak akses default',
    category: 'Sistem & Administrasi',
  },
];

/**
 * Generate full default template dictionary with all keys set to false.
 */
export const getEmptyPermissions = () => {
  return ALL_PERMISSIONS.reduce((acc, perm) => {
    acc[perm.key] = false;
    return acc;
  }, {});
};

/**
 * Built-in System Roles with default templates
 */
export const BUILT_IN_ROLES = [
  {
    code: 'ADMIN',
    name: 'Admin',
    description: 'Administrator dengan wewenang penuh mengurus seluruh fitur, operasional, logistik, dan pengaturan sistem.',
    badgeColor: 'blue',
    isSystem: true,
    workspaceTab: 'role-workspace',
    defaultPermissions: ALL_PERMISSIONS.reduce((acc, p) => {
      acc[p.key] = true;
      return acc;
    }, {}),
  },
  {
    code: 'SUPERVISOR',
    name: 'Supervisor',
    description: 'Supervisi tim sales, monitoring live GPS, persetujuan toko baru, validasi koordinat, dan laporan.',
    badgeColor: 'purple',
    isSystem: true,
    workspaceTab: 'role-workspace',
    defaultPermissions: {
      ...getEmptyPermissions(),
      can_view_dashboard: true,
      can_view_live_tracking: true,
      can_view_daily_call: true,
      can_access_rjp: true,
      can_manage_rjp: true,
      can_register_outlet: true,
      can_approve_outlet: true,
      can_manage_outlets: true,
      can_validate_outlet: true,
      can_view_outlet_report: true,
      can_create_order: true,
      can_approve_order: true,
      can_unlock_absensi: true,
      can_view_team: true,
      can_manage_clusters: true,
      can_view_reports: true,
      can_export_reports: true,
    },
  },
  {
    code: 'SALES',
    name: 'Sales Field',
    description: 'Sales lapangan untuk eksekusi rute PJP, absensi toko, input pesanan PO, dan registrasi NOO.',
    badgeColor: 'emerald',
    isSystem: true,
    workspaceTab: 'role-workspace',
    defaultPermissions: {
      ...getEmptyPermissions(),
      can_view_dashboard: true,
      can_access_rjp: true,
      can_request_reroute: true,
      can_register_outlet: true,
      can_create_order: true,
    },
  },
  {
    code: 'KEPALA_GUDANG',
    name: 'Kepala Gudang',
    description: 'Manajemen logistik gudang, menerima packing list dari admin, alokasi rute supir, dan monitor pengiriman.',
    badgeColor: 'amber',
    isSystem: true,
    workspaceTab: 'role-workspace',
    defaultPermissions: {
      ...getEmptyPermissions(),
      can_view_dashboard: true,
      can_manage_delivery: true,
      can_manage_packing_list: true,
      can_manage_delivery_routes: true,
      can_monitor_delivery: true,
    },
  },
  {
    code: 'SUPIR',
    name: 'Supir Pengiriman',
    description: 'Armada pengiriman lapangan, navigasi rute pengantaran toko, dan input bukti serah terima barang.',
    badgeColor: 'orange',
    isSystem: true,
    workspaceTab: 'role-workspace',
    defaultPermissions: {
      ...getEmptyPermissions(),
      can_access_driver_map: true,
    },
  },
];
