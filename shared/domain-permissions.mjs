const all=['ADMIN','SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR'];
const define=(key,label,roles,categoryId,desc)=>({key,label,roles,categoryId,desc});
export const DOMAIN_PERMISSIONS={
 START_SHIFT:define('can_start_shift','Mulai shift sendiri',all,'team','Penutupan shift yang sudah aktif tetap tersedia.'),
 SALES_VISIT:define('can_record_sales_visit','Mulai kunjungan PJP Sales',['SALES'],'rjp','Penyelesaian kunjungan yang sudah aktif tetap tersedia.'),
 OFF_PJP:define('can_submit_off_pjp','Ajukan kunjungan luar PJP',['SALES'],'rjp','Pengajuan baru terpisah dari izin pemeriksa dan hasil manual.'),
 SPV_VISIT:define('can_record_supervisor_visit','Mulai kunjungan supervisi',['ADMIN','SUPERVISOR'],'rjp','Kunjungan PJP/mandiri sendiri; audit dan penyelesaian kegiatan aktif tetap tersedia.'),
 EXCEPTION_REVIEW:define('can_review_attendance_exception','Periksa pengecualian presensi',['ADMIN','SUPERVISOR'],'transaction','Akui atau minta klarifikasi; tidak membuat bukti keluar atau memutuskan hasil penjualan manual.'),
 REQUEST_EXCEPTION:define('can_request_attendance_exception','Ajukan pengecualian presensi',['SALES'],'transaction','Pengajuan radius/lokasi terpisah dari izin menyetujuinya.'),
 CREATE_PRODUCT:define('can_create_product','Tambahkan produk katalog',['ADMIN','SALES'],'team','Penambahan oleh Sales juga mengikuti aturan operasional; tanpa pengelolaan stok.'),
 MANAGE_PRODUCT:define('can_manage_products','Ubah / nonaktifkan produk',['ADMIN'],'team','Kelola identitas, satuan dan harga katalog; histori transaksi dipertahankan.'),
 MANAGE_DIVISION:define('can_manage_divisions','Kelola divisi',['ADMIN'],'team','Tambah, ubah dan nonaktifkan master divisi.'),
 MANAGE_VEHICLE:define('can_manage_vehicles','Kelola master kendaraan',['ADMIN','SUPERVISOR'],'warehouse','Tambah, ubah dan nonaktifkan armada.'),
 VEHICLE_CONDITION:define('can_change_vehicle_condition','Ubah kondisi kendaraan',['ADMIN','SUPERVISOR','KEPALA_GUDANG'],'warehouse','Kondisi kendaraan dan dampak terhadap trip terbuka.'),
 VEHICLE_MAINTENANCE:define('can_record_vehicle_maintenance','Catat servis kendaraan',['ADMIN','SUPERVISOR','KEPALA_GUDANG','SUPIR'],'warehouse','Catatan servis dengan foto struk, titik bengkel dan odometer aktual; Supir hanya untuk kendaraan penugasannya.'),
 VEHICLE_POLICY:define('can_manage_vehicle_service_policy','Atur interval servis kendaraan',['ADMIN'],'warehouse','Aturan servis khusus kendaraan, dengan alasan dan revisi.'),
 INVOICE_CORRECTION:define('can_correct_invoice','Koreksi referensi faktur',['ADMIN'],'warehouse','Koreksi komersial beralasan, mengikuti sumber dan revisi dokumen.'),
 INVOICE_RECONCILIATION:define('can_reconcile_invoice','Rekonsiliasi faktur dan penerimaan',['ADMIN'],'warehouse','Mencocokkan jumlah dokumen dan penerimaan; bukan proses pembayaran.'),
 ASSIGN_TEAM:define('can_assign_team','Alihkan tim dan wilayah Sales',['ADMIN','SUPERVISOR'],'team','Tetap memerlukan akses tim, lingkup Supervisor dan kelayakan PIC pekerjaan terbuka.'),
 REPORT_TARGET:define('can_manage_sales_targets','Atur target Sales',['ADMIN'],'reports','Target per Sales/periode dengan alasan dan revisi.'),
 REPORT_CALENDAR:define('can_manage_report_calendar','Atur kalender laporan',['ADMIN'],'reports','Hari kerja dan pengecualian kalender laporan.'),
 REPORT_ARCHIVE:define('can_create_report_archive','Buat arsip laporan',['ADMIN'],'reports','Membuat arsip baru; pembacaan arsip tetap mengikuti akses laporan.'),
 RESOLVE_DELIVERY_ISSUE:define('can_resolve_delivery_issue','Selesaikan kendala pengiriman',['ADMIN','KEPALA_GUDANG','SUPIR'],'warehouse','Driver hanya menyelesaikan kendala miliknya; akses monitor/peta tetap diperlukan.'),
};
export const CORE_ADMIN_ACTIONS={
 SYSTEM:{key:'can_manage_system_config',label:'Pengaturan sistem',roles:['ADMIN']},
 USERS:{key:'can_manage_users',label:'Manajemen pengguna',roles:['ADMIN']},
 ROLES:{key:'can_manage_roles',label:'Kelola role dan template',roles:['ADMIN']},
};
export const domainPermissionDefaults=role=>Object.fromEntries(Object.values(DOMAIN_PERMISSIONS).map(p=>[p.key,p.roles.includes(role)]));
export function canDomainAction(actor,action){
 const rule=DOMAIN_PERMISSIONS[action]||CORE_ADMIN_ACTIONS[action];
 return Boolean(rule&&actor&&!actor.deletedAt&&rule.roles.includes(actor.role)&&actor.permissions?.[rule.key]!==false);
}
export const ADMIN_RECOVERY_KEYS=Object.values(CORE_ADMIN_ACTIONS).map(p=>p.key);
export const hasAdminRecovery=actor=>actor?.role==='ADMIN'&&!actor.deletedAt&&ADMIN_RECOVERY_KEYS.every(key=>actor.permissions?.[key]!==false);
