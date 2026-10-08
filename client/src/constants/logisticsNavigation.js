import {LuPackage,LuTruck,LuMap,LuWrench,LuUserCheck,LuClipboardCheck,LuSettings} from 'react-icons/lu';
import {getNavigationTabs,TAB_IDS} from './navigation';
const warehouse=[
 {id:'packing',label:'Antrean packing',icon:LuPackage,description:'Periksa dokumen dari Admin dan sisa muatan yang perlu dialokasikan.',tabs:[TAB_IDS.DELIVERY_PACKING_LIST]},
 {id:'planning',label:'Rencana trip',icon:LuTruck,description:'Tetapkan truk, driver, pembagian muatan, dan persiapan keberangkatan.',tabs:[TAB_IDS.DELIVERY_ROUTES]},
 {id:'monitor',label:'Pantau pengiriman',icon:LuMap,description:'Pantau trip lintas tanggal, titik absensi, GPS, dan hasil pengiriman.',tabs:[TAB_IDS.DELIVERY_MONITOR]},
 {id:'attention',label:'Tindak lanjut gudang',icon:LuClipboardCheck,description:'Tuntaskan kendala pengiriman dan periksa sisa pemenuhan order.',tabs:[TAB_IDS.WAREHOUSE_ATTENTION]},
 {id:'vehicles',label:'Kendaraan & servis',icon:LuWrench,description:'Periksa kelayakan armada, kilometer, dan kebutuhan servis.',tabs:[TAB_IDS.WAREHOUSE_VEHICLES]},
 {id:'attendance',label:'Presensi saya',icon:LuUserCheck,description:'Catat mulai dan selesai kerja serta periksa riwayat presensi.',tabs:[TAB_IDS.WAREHOUSE_ATTENDANCE]},
];
const driver=[
 {id:'trips',label:'Trip saya',icon:LuTruck,description:'Lanjutkan perjalanan, absen di tujuan, dan laporkan hasil pengiriman.',tabs:[TAB_IDS.DRIVER_TRIPS]},
 {id:'map',label:'Peta tujuan',icon:LuMap,description:'Lihat urutan tujuan pada peta dan buka navigasi untuk trip pilihan.',tabs:[TAB_IDS.DELIVERY_DRIVER_MAP]},
];
export function getLogisticsNavigationGroups(user){
 if(!['KEPALA_GUDANG','SUPIR'].includes(user?.role))return [];
 const tabs=getNavigationTabs(user),groups=user.role==='SUPIR'?driver:warehouse;
 const used=new Set([TAB_IDS.ROLE_WORKSPACE,TAB_IDS.DASHBOARD,...groups.flatMap(g=>g.tabs)]);
 const result=groups.map(g=>({...g,items:g.tabs.flatMap(id=>{const tab=tabs.find(t=>t.id===id);return tab?[{...tab,label:g.label}]:[];})})).filter(g=>g.items.length);
 const extra=tabs.filter(t=>!used.has(t.id));
 if(extra.length)result.push({id:'additional',label:'Akses tambahan',icon:LuSettings,description:'Fitur tambahan sesuai izin akun Anda.',items:extra});
 return result;
}
