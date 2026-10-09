import bcrypt from 'bcryptjs';
import {CONFIG_PARAMS} from '../../../shared/config.mjs';
import {BUILT_IN_ROLES} from '../../src/modules/roles/roles.constants.js';
import {at,offsetDate} from '../seeds/context.js';
import {id,ensure,sourceData,people,email,note,fixturePolicy} from './context.js';

export async function seedMaster(db,date){
 for(const param of CONFIG_PARAMS)await db.systemConfig.upsert({where:{key:param.key},update:{},create:{key:param.key,value:param.defaultValue}});
 await db.systemConfig.upsert({where:{key:'ROLE_DEFINITIONS'},update:{},create:{key:'ROLE_DEFINITIONS',value:BUILT_IN_ROLES}});
 const password=await bcrypt.hash(process.env.SEED_PASSWORD||'DemoSinar2026!',10),users={},newUsers=new Set();
 for(const [key,name,role,staffCode,team] of people){if(!await db.user.findUnique({where:{email:email(key)}}))newUsers.add(key);users[key]=await db.user.upsert({where:{email:email(key)},update:{},create:{id:id(key),name:`${name} (Uji Belfoods)`,email:email(key),password,role,roleCode:role,staffCode:staffCode||null,...(role==='SALES'?{supervisorId:users[`spv-${team+1}`].id}:{})}});}
 const sales=people.filter(p=>p[2]==='SALES').map(p=>users[p[0]]),supervisors=[users['spv-1'],users['spv-2']];
 const source=sourceData(),groups=[],clusters=[];
 for(const [index,member] of sales.entries()){
  const code=member.staffCode,rows=source.outlets.filter(r=>r.sales.startsWith(code)),mt=index>=2;
  if(rows.length!==4||rows.some(r=>!Number.isFinite(r.latitude)||!Number.isFinite(r.longitude)||Math.abs(r.latitude)>90||Math.abs(r.longitude)>180))throw new Error(`Sumber kurasi ${code} tidak valid`);
  const cluster=await ensure(db,'cluster',`cluster-${code}`,{code:`UJI-BF-${code}`,name:`${mt?'MT':'GT'} ${['Cimahi & Bandung Barat','Bandung','Bandung Raya','Bandung Timur','Bandung Kota'][index]} (Uji Belfoods)`,region:'Bandung Raya · sampel callplan Belfoods',supervisorId:member.supervisorId,assignedSalesId:member.id,outletCount:4,centerLat:rows.reduce((n,r)=>n+r.latitude,0)/4,centerLng:rows.reduce((n,r)=>n+r.longitude,0)/4,colorHex:['#2563eb','#16a34a','#9333ea','#ea580c','#0891b2'][index]});
  clusters.push(cluster);if(newUsers.has(`sales-${index+1}`))await db.user.update({where:{id:member.id},data:{clusterId:cluster.id}});
  const outlets=[];
  for(const row of rows){
   const weekType=/W1\b/.test(row.sales)?'WEEK_1':/W2\b/.test(row.sales)?'WEEK_2':'ALL';
   outlets.push(await db.outlet.upsert({where:{outletCode:row.customer_id},update:{},create:{id:id(`outlet-${row.customer_id}`),outletCode:row.customer_id,name:row.customer_name.trim(),address:row.address.trim(),latitude:row.latitude,longitude:row.longitude,clusterId:cluster.id,source:'BELFOODS_HISTORICAL',channel:mt?'MODERN_TRADE':'GENERAL_TRADE',type:mt?'MODERN_TRADE':'GENERAL_TRADE',subChannel:mt?(index===2?'CHAIN_MINIMARKET':'LOKAL_SUPERMARKET'):'TOKO_RETAIL',itineraryCode:index<2?'F2':index===2?'F4':'F1',radiusMeters:50,validationStatus:'UNVALIDATED',visitSchedule:{days:[row.day],weekType},validationDetails:{source:'BELFOODS_HISTORICAL_CALLPLAN',historicalConfidence:row.geocode_confidence||null,historicalNote:row.catatan_validasi||null,callplanId:row.callplanId,excelCallplanId:row.sourceExcelCallplanId,salesVariant:row.sales,excelSheet:'Sheet1',excelRow:row.sourceExcelRow,originalSequence:row.sequence,note:'Metadata lama; bukan validasi aplikasi. Kontak, syarat pembayaran dan tanggal acuan kunjungan tidak tersedia pada sumber.'},locationEvidence:{source:'HISTORICAL_IMPORT',verified:false,note:'Koordinat sumber lama, belum diverifikasi ulang.'}}}));
  }
  groups.push(outlets);
  const templates=new Map();
  for(const [j,row] of rows.entries()){const w=/W1\b/.test(row.sales)?'WEEK_1':/W2\b/.test(row.sales)?'WEEK_2':'ALL',k=`${row.day}:${w}`;if(!templates.has(k))templates.set(k,[]);templates.get(k).push(outlets[j]);}
  for(const [key,list] of templates){const [day,weekType]=key.split(':');await db.pjpTemplate.upsert({where:{userId_dayOfWeek_weekType:{userId:member.id,dayOfWeek:Number(day),weekType}},update:{},create:{id:id(`template-${code}-${key}`),userId:member.id,dayOfWeek:Number(day),weekType,stops:{create:list.map((o,j)=>({id:id(`template-stop-${code}-${key}-${j}`),outletId:o.id,sequence:j+1}))}}});}
 }
 const division=await db.division.upsert({where:{code:'BELFOODS'},update:{},create:{id:id('division'),code:'BELFOODS',name:'BELFOODS'}});
 const products=[];
 for(const [index,name,price] of [[1,'Nugget ayam 500 g',35000],[2,'Sosis ayam 375 g',24000],[3,'Bakso ayam 500 g',28000]])products.push(await db.product.upsert({where:{sku:`UJI-BF-SKU-${index}`},update:{},create:{id:id(`product-${index}`),sku:`UJI-BF-SKU-${index}`,code:`UJI-BF-P${index}`,name:`${name} (Uji Belfoods)`,price,unit:'pak',baseUnit:'pak',unitsPerUnit:1,stock:0}}));
 const vehicles=[];
 for(let i=0;i<3;i++)vehicles.push(await db.vehicle.upsert({where:{code:`UJI-BF-ARMADA-${i+1}`},update:{},create:{id:id(`vehicle-${i}`),code:`UJI-BF-ARMADA-${i+1}`,name:`Mobil distribusi ${i+1} (Uji Belfoods)`,maxCartons:40,maxWeightKg:500,fuelKmPerLiter:10,fuelType:'SOLAR',fuelPricePerLiter:10000,totalKm:1200,lastOilChangeKm:i===2?1000:0,condition:i===2?'IN_SERVICE':'AVAILABLE'}}));
 await ensure(db,'vehicleServiceRecord','service',{vehicleId:vehicles[2].id,serviceDate:at(offsetDate(date,-7)),workshopName:'Bengkel uji',serviceType:'GANTI_OLI',cost:450000,odometerAtService:1000,notes:note,policySnapshot:fixturePolicy(date)});
 return {users,sales,supervisors,groups,clusters,products,vehicles,division,source};
}
