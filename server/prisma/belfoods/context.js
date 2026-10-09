import {createHash} from 'node:crypto';
import {BELFOODS_FIXTURE} from './fixtures.js';
import {CONFIG_DEFAULTS} from '../../../shared/config.mjs';
export const id=key=>{
 const hash=createHash('sha256').update(`belfoods-uat-v1:${key}`).digest('hex');
 return `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
};
export const ensure=(db,model,key,data)=>db[model].upsert({where:{id:id(key)},update:{},create:{id:id(key),...data}});
export const sourceData=()=>structuredClone(BELFOODS_FIXTURE);
export const note='Skenario uji Belfoods; aktivitas, nominal dan waktu simulasi, bukan transaksi historis sumber.';
export const fixturePolicy=(day,extra={})=>({provenance:'BELFOODS_UAT_SIMULATION',at:`${day}T00:00:00+07:00`,versions:[],values:{...CONFIG_DEFAULTS,SALES_REQUIRE_GPS:false,SALES_IN_PHOTO:'OPTIONAL',SALES_OUT_PHOTO:'OPTIONAL',ATTENDANCE_REQUIRE_PHOTO:false,ATTENDANCE_ENFORCE_GEOFENCE:false,GPS_REQUIRE_METADATA:false,DELIVERY_REQUIRE_GPS:false,DELIVERY_REQUIRE_PHOTO:false,DELIVERY_REQUIRE_GEOFENCE:false,...extra}});
export const people=[
 ['admin','Admin Belfoods','ADMIN'],['spv-1','SPV General Trade','SUPERVISOR'],['spv-2','SPV Modern Trade','SUPERVISOR'],
 ['sales-1','Cahya','SALES','SLD514',0],['sales-2','Dadan','SALES','SLD516',0],['sales-3','Puri','SALES','SLD515',1],
 ['sales-4','Yati','SALES','SLD517',1],['sales-5','Yuli','SALES','SLD539',1],
 ['gudang','Kepala Gudang Belfoods','KEPALA_GUDANG'],['supir-1','Driver Belfoods Satu','SUPIR'],['supir-2','Driver Belfoods Dua','SUPIR'],
];
export const email=key=>`${key}.demo@sinaranugrah.test`;
