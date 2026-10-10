import {getNavigationTabs,TAB_IDS,isTabPermissionAllowed} from './navigation';
import {LuFileCheck,LuTruck,LuStore,LuUsers,LuClipboardList,LuChartColumn,LuSettings,LuPackage,LuCalendarDays} from 'react-icons/lu';

const GROUPS=[
  {id:'orders',label:'Order',icon:LuFileCheck,description:'Periksa order, rincian barang, dan keputusan persetujuan.',tabs:[TAB_IDS.ADMIN_APPROVAL,TAB_IDS.ADMIN_PRODUCTS]},
  {id:'delivery',label:'Packing & pengiriman',icon:LuTruck,description:'Siapkan packing, alokasikan kendaraan, dan pantau perjalanan.',tabs:[TAB_IDS.DELIVERY_PACKING_LIST,TAB_IDS.DELIVERY_ROUTES,TAB_IDS.DELIVERY_MONITOR]},
  {id:'outlets',label:'Outlet',icon:LuStore,description:'Kelola pelanggan, persetujuan, dan ketepatan lokasi.',tabs:[TAB_IDS.OUTLET_MANAGEMENT,TAB_IDS.OUTLET_APPROVAL,TAB_IDS.OUTLET_VALIDATION,TAB_IDS.DASHBOARD]},
  {id:'sales',label:'Sales & wilayah',icon:LuUsers,description:'Pantau kunjungan, atur tim, wilayah, dan jadwal kerja.',tabs:[TAB_IDS.DAILY_CALL_MONITOR,TAB_IDS.TEAM_TRACKING,TAB_IDS.ROUTE_PLANNING,TAB_IDS.ADMIN_PJP]},
  {id:'attention',label:'Tindak lanjut',icon:LuClipboardList,description:'Tuntaskan pekerjaan yang membutuhkan penanggung jawab dan keputusan.',tabs:[TAB_IDS.ADMIN_ATTENTION]},
  {id:'reports',label:'Laporan',icon:LuChartColumn,description:'Telusuri hasil operasional, registrasi outlet, dan absensi.',tabs:[TAB_IDS.REPORTS,TAB_IDS.OUTLET_REGISTRATION_REPORT,TAB_IDS.ADMIN_ATTENDANCE]},
  {id:'system',label:'Sistem',icon:LuSettings,description:'Kelola pengguna, hak akses, master, dan aturan aplikasi.',tabs:[TAB_IDS.USER_MANAGEMENT,TAB_IDS.ADMIN_MASTERS,TAB_IDS.SYSTEM_CONFIG]},
];
const TOOLS=[
  {id:TAB_IDS.ADMIN_PRODUCTS,label:'Katalog produk',description:'Kelola produk, satuan dan harga referensi order.',icon:LuPackage},
  {id:TAB_IDS.ADMIN_PJP,label:'Siapkan PJP',description:'Siapkan penomoran dan jadwal kunjungan harian.',icon:LuCalendarDays},
  {id:TAB_IDS.ADMIN_ATTENDANCE,label:'Absensi staf',description:'Periksa rekap kehadiran staf.',icon:LuUsers},
  {id:TAB_IDS.ADMIN_MASTERS,label:'Divisi & kendaraan',description:'Kelola referensi divisi dan kapasitas armada.',icon:LuTruck},
];
const DETAILS={
  [TAB_IDS.ADMIN_ATTENTION]:['Tindak lanjut','Periksa tenggat, penanggung jawab, dan pekerjaan lintas modul.'],
  [TAB_IDS.ADMIN_APPROVAL]:['Order & persetujuan','Tinjau order sales dan permintaan buka kunci outlet.'],
  [TAB_IDS.DAILY_CALL_MONITOR]:['Kunjungan sales','Pantau kunjungan, nominal order, dan SKU sales.'],
  [TAB_IDS.ROUTE_PLANNING]:['Wilayah & jadwal RJP','Kelola kluster outlet, template mingguan, dan PJP harian.'],
  [TAB_IDS.TEAM_TRACKING]:['Tim sales','Tetapkan supervisor, anggota tim, dan pantau posisi sales.'],
  [TAB_IDS.DASHBOARD]:['Peta operasional','Lihat sebaran outlet dan kegiatan lapangan.'],
  [TAB_IDS.OUTLET_MANAGEMENT]:['Master outlet','Kelola identitas pelanggan, alamat, dan wilayah toko.'],
  [TAB_IDS.OUTLET_REGISTRATION]:['Daftarkan outlet','Buat pengajuan toko baru.'],
  [TAB_IDS.OUTLET_APPROVAL]:['Persetujuan outlet','Periksa pengajuan dan aktifkan toko yang memenuhi syarat.'],
  [TAB_IDS.OUTLET_VALIDATION]:['Validasi outlet','Cocokkan identitas dan lokasi melalui Google atau bukti lapangan.'],
  [TAB_IDS.DELIVERY_PACKING_LIST]:['Packing list','Susun dokumen muatan dan kirim ke kepala gudang.'],
  [TAB_IDS.DELIVERY_ROUTES]:['Rute & alokasi mobil','Bagi muatan ke kendaraan dan tetapkan supir.'],
  [TAB_IDS.DELIVERY_MONITOR]:['Monitor pengiriman','Pantau perjalanan, hasil pengiriman, dan retur.'],
  [TAB_IDS.REPORTS]:['Laporan operasional','Buka rekap kunjungan, absensi, dan penjualan.'],
  [TAB_IDS.OUTLET_REGISTRATION_REPORT]:['Laporan registrasi outlet','Telusuri status dan riwayat pengajuan toko baru.'],
  [TAB_IDS.USER_MANAGEMENT]:['Pengguna & hak akses','Kelola akun, role, dan izin fitur.'],
  [TAB_IDS.SYSTEM_CONFIG]:['Pengaturan sistem','Atur parameter dan pilihan alur operasional.'],
};
export function getAdminNavigationGroups(user){
  const tabs=getNavigationTabs(user).filter(tab=>tab.id!==TAB_IDS.ROLE_WORKSPACE&&isTabPermissionAllowed(tab.id,user)).map(tab=>({...tab,...TOOLS.find(tool=>tool.id===tab.id)}));
  const groups=GROUPS.map(group=>({...group,items:group.tabs.flatMap(id=>{
    const tab=tabs.find(item=>item.id===id);
    return tab?[{...tab,label:DETAILS[id]?.[0] || tab.label,description:DETAILS[id]?.[1] || tab.description || 'Buka modul operasional.'}]:[];
  })})).filter(group=>group.items.length);
  return groups;
}
export function getAdminMobileNavigation(user){
  const tabs=[...getNavigationTabs(user).filter(tab=>tab.id===TAB_IDS.ROLE_WORKSPACE),...getAdminNavigationGroups(user).flatMap(group=>group.items)];
  const ids=[TAB_IDS.ROLE_WORKSPACE,TAB_IDS.ADMIN_APPROVAL,TAB_IDS.DELIVERY_PACKING_LIST,TAB_IDS.REPORTS];
  const primary=ids.flatMap(id=>{const tab=tabs.find(item=>item.id===id);return tab?[tab]:[];});
  return {primary,secondary:tabs.filter(tab=>!primary.some(item=>item.id===tab.id))};
}

export const adminParentTab=id=>[TAB_IDS.CREATE_CLUSTER,TAB_IDS.MASTER_CLUSTERS].includes(id)?TAB_IDS.ROUTE_PLANNING:id;
export const getAdminActiveGroup=(user,id)=>getAdminNavigationGroups(user).find(group=>group.items.some(item=>item.id===adminParentTab(id)));
