import {getNavigationTabs,TAB_IDS} from './navigation';

const GROUPS=[
  {id:'operations',label:'Operasional',description:'Persetujuan, kunjungan sales, tim, dan jadwal.',tabs:[TAB_IDS.ADMIN_APPROVAL,TAB_IDS.DAILY_CALL_MONITOR,TAB_IDS.ROUTE_PLANNING,TAB_IDS.TEAM_TRACKING,TAB_IDS.DASHBOARD]},
  {id:'outlets',label:'Outlet',description:'Data toko, pendaftaran baru, dan validasi lokasi.',tabs:[TAB_IDS.OUTLET_MANAGEMENT,TAB_IDS.OUTLET_REGISTRATION,TAB_IDS.OUTLET_APPROVAL,TAB_IDS.OUTLET_VALIDATION]},
  {id:'delivery',label:'Pengiriman',description:'Susun packing, alokasikan kendaraan, lalu pantau pengiriman.',tabs:[TAB_IDS.DELIVERY_PACKING_LIST,TAB_IDS.DELIVERY_ROUTES,TAB_IDS.DELIVERY_MONITOR,TAB_IDS.DELIVERY_DRIVER_MAP]},
  {id:'system',label:'Laporan & sistem',description:'Hasil operasional, akun pengguna, dan parameter admin.',tabs:[TAB_IDS.REPORTS,TAB_IDS.OUTLET_REGISTRATION_REPORT,TAB_IDS.USER_MANAGEMENT,TAB_IDS.SYSTEM_CONFIG]},
];
const DETAILS={
  [TAB_IDS.ADMIN_APPROVAL]:['Order & izin absensi','Tinjau order sales dan permintaan buka kunci outlet.'],
  [TAB_IDS.DAILY_CALL_MONITOR]:['Daily Call Monitor','Pantau kunjungan, nominal order, dan SKU sales.'],
  [TAB_IDS.ROUTE_PLANNING]:['Wilayah & jadwal RJP','Kelola kluster outlet, template mingguan, dan PJP harian.'],
  [TAB_IDS.TEAM_TRACKING]:['Tim sales','Tetapkan supervisor, anggota tim, dan pantau posisi sales.'],
  [TAB_IDS.DASHBOARD]:['Peta operasional','Lihat sebaran outlet dan kegiatan lapangan.'],
  [TAB_IDS.OUTLET_MANAGEMENT]:['Master outlet','Kelola identitas, pembayaran, dan wilayah toko.'],
  [TAB_IDS.OUTLET_REGISTRATION]:['Daftarkan outlet','Buat pengajuan toko baru.'],
  [TAB_IDS.OUTLET_APPROVAL]:['Persetujuan outlet','Periksa pengajuan dan aktifkan toko yang memenuhi syarat.'],
  [TAB_IDS.OUTLET_VALIDATION]:['Validasi lokasi outlet','Periksa dan koreksi koordinat toko.'],
  [TAB_IDS.DELIVERY_PACKING_LIST]:['Packing list','Susun dokumen muatan dan kirim ke kepala gudang.'],
  [TAB_IDS.DELIVERY_ROUTES]:['Rute & alokasi mobil','Bagi muatan ke kendaraan dan tetapkan supir.'],
  [TAB_IDS.DELIVERY_MONITOR]:['Monitor pengiriman','Pantau perjalanan, hasil pengiriman, dan retur.'],
  [TAB_IDS.REPORTS]:['Laporan operasional','Buka rekap kunjungan, absensi, dan penjualan.'],
  [TAB_IDS.OUTLET_REGISTRATION_REPORT]:['Laporan registrasi outlet','Telusuri status dan riwayat pengajuan toko baru.'],
  [TAB_IDS.USER_MANAGEMENT]:['Pengguna & hak akses','Kelola akun, role, dan izin fitur.'],
  [TAB_IDS.SYSTEM_CONFIG]:['Pengaturan sistem','Atur parameter dan pilihan alur operasional.'],
};
export function getAdminNavigationGroups(user){
  const tabs=getNavigationTabs(user).filter(tab=>tab.id!==TAB_IDS.ROLE_WORKSPACE);
  const groups=GROUPS.map(group=>({...group,items:group.tabs.flatMap(id=>{
    const tab=tabs.find(item=>item.id===id);
    return tab?[{...tab,label:DETAILS[id]?.[0] || tab.label,description:DETAILS[id]?.[1] || 'Buka modul operasional.'}]:[];
  })})).filter(group=>group.items.length);
  const remaining=tabs.filter(tab=>!groups.some(group=>group.items.some(item=>item.id===tab.id)));
  if(remaining.length)groups.push({id:'other',label:'Menu tambahan',description:'Fitur sesuai hak akses akun.',items:remaining});
  return groups;
}
export function getAdminMobileNavigation(user){
  const tabs=getNavigationTabs(user);
  const ids=[TAB_IDS.ROLE_WORKSPACE,TAB_IDS.ADMIN_APPROVAL,TAB_IDS.DELIVERY_PACKING_LIST,TAB_IDS.REPORTS];
  const primary=ids.flatMap(id=>{const tab=tabs.find(item=>item.id===id);return tab?[tab]:[];});
  return {primary,secondary:tabs.filter(tab=>!primary.some(item=>item.id===tab.id))};
}

export const adminParentTab=id=>[TAB_IDS.CREATE_CLUSTER,TAB_IDS.MASTER_CLUSTERS].includes(id)?TAB_IDS.ROUTE_PLANNING:id;
