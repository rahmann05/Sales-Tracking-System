import {getNavigationTabs,TAB_IDS,isTabPermissionAllowed} from './navigation';
import {LuMap,LuFileCheck,LuNavigation,LuUsers,LuStore,LuClipboardList,LuChartColumn,LuSettings} from 'react-icons/lu';

const GROUPS=[
  {id:'monitor',label:'Pantau tim',icon:LuMap,description:'Lihat progres kunjungan, posisi, dan aktivitas sales.',tabs:[TAB_IDS.SPV_MONITOR]},
  {id:'approval',label:'Persetujuan',icon:LuFileCheck,description:'Periksa order dan permintaan yang membutuhkan keputusan.',tabs:[TAB_IDS.SPV_APPROVAL,TAB_IDS.OUTLET_APPROVAL]},
  {id:'field',label:'Kunjungan saya',icon:LuNavigation,description:'Mulai shift, dampingi sales, dan catat hasil supervisi.',tabs:[TAB_IDS.SPV_FIELD]},
  {id:'team',label:'Tim & jadwal',icon:LuUsers,description:'Atur anggota, wilayah outlet, dan jadwal RJP.',tabs:[TAB_IDS.TEAM_TRACKING,TAB_IDS.ROUTE_PLANNING]},
  {id:'outlets',label:'Outlet',icon:LuStore,description:'Kelola identitas pelanggan dan ketepatan lokasi toko.',tabs:[TAB_IDS.OUTLET_MANAGEMENT,TAB_IDS.OUTLET_VALIDATION,TAB_IDS.OUTLET_REGISTRATION,TAB_IDS.DASHBOARD]},
  {id:'attention',label:'Tindak lanjut',icon:LuClipboardList,description:'Pantau temuan, tenggat, dan penyelesaian pekerjaan tim.',tabs:[TAB_IDS.SPV_ATTENTION]},
  {id:'reports',label:'Laporan',icon:LuChartColumn,description:'Evaluasi hasil operasional dan telusuri riwayat tim.',tabs:[TAB_IDS.REPORTS,TAB_IDS.OUTLET_REGISTRATION_REPORT]},
];
const LABELS={
  [TAB_IDS.SPV_MONITOR]:'Aktivitas & posisi sales',[TAB_IDS.SPV_APPROVAL]:'Order & pengecualian',
  [TAB_IDS.SPV_FIELD]:'Supervisi lapangan',[TAB_IDS.SPV_ATTENTION]:'Pekerjaan terbuka',
  [TAB_IDS.TEAM_TRACKING]:'Anggota tim',[TAB_IDS.ROUTE_PLANNING]:'Wilayah & jadwal RJP',
  [TAB_IDS.OUTLET_MANAGEMENT]:'Direktori outlet',[TAB_IDS.OUTLET_APPROVAL]:'Pengajuan outlet',
  [TAB_IDS.OUTLET_VALIDATION]:'Validasi lokasi',[TAB_IDS.REPORTS]:'Rekap operasional',
  [TAB_IDS.DASHBOARD]:'Peta outlet',
};
export const supervisorParentTab=id=>({[TAB_IDS.ADMIN_APPROVAL]:TAB_IDS.SPV_APPROVAL,[TAB_IDS.DAILY_CALL_MONITOR]:TAB_IDS.SPV_MONITOR,[TAB_IDS.CREATE_CLUSTER]:TAB_IDS.ROUTE_PLANNING,[TAB_IDS.MASTER_CLUSTERS]:TAB_IDS.ROUTE_PLANNING})[id]||id;
export function getSupervisorNavigationGroups(user){
  if(user?.role!=='SUPERVISOR')return [];
  const tabs=getNavigationTabs(user);
  const groups=GROUPS.map(group=>({...group,items:group.tabs.flatMap(id=>{
    const tab=tabs.find(item=>item.id===id);
    return tab&&isTabPermissionAllowed(id,user)?[{...tab,label:LABELS[id]||tab.label}]:[];
  })})).filter(group=>group.items.length);
  const used=new Set([...GROUPS.flatMap(group=>group.tabs),TAB_IDS.ROLE_WORKSPACE,TAB_IDS.ADMIN_APPROVAL,TAB_IDS.DAILY_CALL_MONITOR]);
  const extra=tabs.filter(tab=>!used.has(tab.id));
  if(extra.length)groups.push({id:'additional',label:'Akses tambahan',icon:LuSettings,description:'Fitur tambahan yang diberikan untuk akun Anda.',items:extra});
  return groups;
}
export const getSupervisorActiveGroup=(user,id)=>getSupervisorNavigationGroups(user).find(group=>group.items.some(item=>item.id===supervisorParentTab(id)));
