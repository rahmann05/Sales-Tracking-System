import React from 'react';
const actions = [
 ['can_run_outlet_review', 'pemeriksaan Google'],
 ['can_propose_outlet_review', 'usulan koreksi master'],
 ['can_apply_outlet_review', 'keputusan pemeriksaan'],
 ['can_assign_outlet_review', 'penugasan Sales'],
];
export function OutletValidationAccessNotice({permissions={},map}) {
 const missing=actions.filter(([key])=>permissions[key]!==true).map(([,label])=>label);
 const googleUnavailable=permissions.can_run_outlet_review===true&&(!map.canStart||map.settings.OUTLET_MAP_COMPARISON_ENABLED===false);
 if(!missing.length&&!googleUnavailable)return null;
 return <section className="ov-notice" aria-label="Ketersediaan tindakan validasi">
  {missing.length>0&&<p role="status">Aksi yang belum tersedia untuk akun ini: {missing.join(', ')}. Admin dapat memeriksa izin di Sistem → Pengguna &amp; hak akses. Setelah izin atau backend diperbarui, muat ulang halaman untuk menyegarkan sesi.</p>}
  {googleUnavailable&&<p role="status">Pemeriksaan Google belum dapat dijalankan: {!map.canStart?map.reason:'Perbandingan peta outlet dinonaktifkan pada Pengaturan sistem.'}</p>}
 </section>;
}
