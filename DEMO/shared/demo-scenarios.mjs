export const DEMO_SCENARIOS = [
  {
    id: 'cluster-to-sales',
    title: '1. Buat Cluster -> Cek Jadwal & Absen Sales',
    summary:
      'Uji pembentukan cluster beserta jadwal mingguan lalu langsung berpindah ke akun Sales untuk melihat dan mengeksekusi rutenya.',
    steps: [
      {
        role: 'ADMIN',
        action: 'Buka tab Cluster & Rute -> buat/edit cluster dan tugaskan ke Sales',
      },
      {
        role: 'SALES',
        action: 'Klik tombol "Sync PJP" pada kartu Sales lalu buka akun Sales tersebut',
      },
      { role: 'SALES', action: 'Buka tab Kunjungan / Peta Rute -> jalankan Check-In & Check-Out' },
    ],
  },
  {
    id: 'noo-approval-loop',
    title: '2. Ajukan NOO -> Approve SPV -> Finalisasi Admin',
    summary:
      'Uji pendaftaran outlet baru dari lapangan hingga disetujui Supervisor dan diterbitkan menjadi outlet master oleh Admin.',
    steps: [
      { role: 'SALES', action: 'Buka menu Registrasi Outlet (NOO) dan kirim pengajuan baru' },
      {
        role: 'SUPERVISOR',
        action: 'Pindah ke Supervisor -> buka Persetujuan NOO -> Setujui tahap SPV',
      },
      {
        role: 'ADMIN',
        action: 'Pindah ke Admin -> Finalisasi pengajuan menjadi Outlet master aktif',
      },
      {
        role: 'SALES',
        action: 'Kembali ke Sales untuk verifikasi status dan ketersediaan outlet baru',
      },
    ],
  },
  {
    id: 'order-to-delivery',
    title: '3. Order Sales -> Gudang Packing -> Kirim Supir',
    summary:
      'Uji siklus komersial utuh dari pengajuan order, persetujuan, penyusunan muatan gudang, sampai serah terima oleh Supir.',
    steps: [
      { role: 'SALES', action: 'Ajukan Order penjualan baru dari tab Kunjungan atau Pesanan' },
      {
        role: 'ADMIN',
        action: 'Setujui order melalui akun Admin/Supervisor sesuai kebijakan aktif',
      },
      {
        role: 'KEPALA_GUDANG',
        action: 'Buat & Release Packing List lalu jadwalkan Rute Pengiriman',
      },
      {
        role: 'SUPIR',
        action: 'Pindah ke Supir -> Mulai Trip -> Catat hasil kirim tiap outlet -> Tutup Trip',
      },
    ],
  },
  {
    id: 'exception-and-monitoring',
    title: '4. Off-PJP / Toko Tutup -> Tindak Lanjut -> Laporan MTD',
    summary:
      'Uji pelaporan toko tutup, kunjungan luar RJP, persetujuan pengecualian Supervisor, dan agregasi laporan.',
    steps: [
      { role: 'SALES', action: 'Kirim laporan Toko Tutup atau absen Off-PJP' },
      { role: 'SUPERVISOR', action: 'Tinjau antrean Attention/Reroute & tindak lanjut kunjungan' },
      { role: 'ADMIN', action: 'Buka Laporan Harian/WTD/MTD serta Monitoring GPS & Audit' },
    ],
  },
];
