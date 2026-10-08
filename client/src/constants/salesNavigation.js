import {LuNavigation,LuClipboardList,LuFileCheck,LuUserPlus,LuCalendarDays,LuMap,LuSettings} from 'react-icons/lu';
import {getNavigationTabs,TAB_IDS} from './navigation';
const groups=[
  {id:'visits',label:'Kunjungan hari ini',icon:LuNavigation,description:'Jalankan PJP, catat hasil kunjungan, dan ajukan kunjungan tambahan.',tabs:[TAB_IDS.SALES_VISITS]},
  {id:'orders',label:'Order saya',icon:LuClipboardList,description:'Periksa keputusan order, janji kirim, dan hasil pengiriman.',tabs:[TAB_IDS.SALES_ORDERS]},
  {id:'followup',label:'Tindak lanjut',icon:LuFileCheck,description:'Kerjakan arahan Supervisor dan kirim hasil beserta bukti.',tabs:[TAB_IDS.SALES_FOLLOW_UP]},
  {id:'registration',label:'Outlet baru',icon:LuUserPlus,description:'Daftarkan pelanggan dan pantau status pengajuannya.',tabs:[TAB_IDS.OUTLET_REGISTRATION]},
  {id:'schedule',label:'Jadwal kunjungan',icon:LuCalendarDays,description:'Lihat PJP per tanggal dan urutan toko yang ditugaskan.',tabs:[TAB_IDS.ROUTE_PLANNING]},
  {id:'map',label:'Peta outlet',icon:LuMap,description:'Temukan lokasi outlet dan pahami wilayah kunjungan.',tabs:[TAB_IDS.DASHBOARD]},
];
export function getSalesNavigationGroups(user){
  if(user?.role!=='SALES')return [];
  const tabs=getNavigationTabs(user),used=new Set([TAB_IDS.ROLE_WORKSPACE,...groups.flatMap(group=>group.tabs)]);
  const result=groups.map(group=>({...group,items:group.tabs.flatMap(id=>{const item=tabs.find(tab=>tab.id===id);return item?[{...item,label:group.label}]:[];})})).filter(group=>group.items.length);
  const extra=tabs.filter(tab=>!used.has(tab.id));
  if(extra.length)result.push({id:'additional',label:'Akses tambahan',icon:LuSettings,description:'Fitur tambahan sesuai izin akun Anda.',items:extra});
  return result;
}
