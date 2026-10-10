export const REPORT_VISIBILITY_KEYS=['REPORT_SHOW_COMMERCIAL','REPORT_SHOW_CONTACT','REPORT_SHOW_LOCATION','REPORT_SHOW_EVIDENCE'];
export const REPORT_RESTRICTED_LABEL='Dibatasi aturan laporan';
const commercial=new Set(['amount','orderAmount','targetAmount','totalOrderAmount','omzet','totalOmzet','mtdOmzet','revenue','totalRevenue','unitPrice','totalPrice','totalAmount','monthlyTarget','monthlyTargetAmount','assignedTargetAmount','mtdActualAmount','targetActualAmount','lastMonthActual','unverifiedChannelAmount','avgDailyRevenue','targetAchievement','achievement','achievementNum','achievementRate','achievementRateNum','overallAchievementRate','overallAchievementRateNum','mtdToLmaRate','contributionRate']);
const contact=new Set(['email','phone','ownerName','address','customerAddress','taxNumber','taxName','taxAddress']);
const location=new Set(['latitude','longitude','lat','lng','customerLat','customerLng','deviationMeters','distanceMeters','distanceFromPrevious','distanceFromPreviousMeters','googleMapsUrl','mapsUrl','mapUrl','gpsEvidence','locationEvidence','locationIn','locationOut']);
const evidence=new Set(['photoUrl','photoIn','photoOut','photoUrls','photo','photos','attachments','signature','signatureDataUrl','taxDocumentUrl','imageUrl']);
export function reportRestrictions(values={}){return REPORT_VISIBILITY_KEYS.filter(key=>values[key]===false);}
export function redactReport(value,values={}){
 const restrictions=reportRestrictions(values),denied=new Set();
 for(const [key,fields] of [['REPORT_SHOW_COMMERCIAL',commercial],['REPORT_SHOW_CONTACT',contact],['REPORT_SHOW_LOCATION',location],['REPORT_SHOW_EVIDENCE',evidence]])if(values[key]===false)for(const field of fields)denied.add(field);
 const walk=node=>{
  if(node===null||typeof node!=='object'||node instanceof Date)return node;
  if(Array.isArray(node))return node.map(walk);
  return Object.fromEntries(Object.entries(node).map(([key,item])=>{
   if(denied.has(key))return [key,null];
   if(values.REPORT_SHOW_COMMERCIAL===false&&key==='target'&&typeof item==='number')return [key,null];
   if(values.REPORT_SHOW_COMMERCIAL===false&&key==='target'&&item&&typeof item==='object')return [key,{status:'RESTRICTED',amount:null,achievement:null,achievementNum:null}];
   if(key==='basis'&&restrictions.length&&item&&typeof item==='object')return [key,{...walk(item),restrictedFields:restrictions,restrictionNote:'Sebagian kolom terstruktur dibatasi oleh aturan laporan pengguna ini. Nilai kosong bukan nol.'}];
   return [key,walk(item)];
  }));
 };
 const result=walk(value);
 if(restrictions.length&&result&&typeof result==='object'&&!Array.isArray(result))result.basis={...result.basis,restrictedFields:restrictions,restrictionNote:'Sebagian kolom terstruktur dibatasi oleh aturan laporan untuk pengguna ini. Nilai kosong bukan nol. Pembatasan laporan tidak mengubah hak akses pada modul operasional lain atau menyaring informasi yang ditulis bebas dalam catatan.'};
 return result;
}
export const reportMoney=value=>value===null||value===undefined?REPORT_RESTRICTED_LABEL:`Rp ${Number(value).toLocaleString('id-ID')}`;
