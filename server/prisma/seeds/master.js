import bcrypt from 'bcryptjs';
import { CONFIG_DEFINITIONS } from '../../../shared/config.mjs';
import { BUILT_IN_ROLES } from '../../src/modules/roles/roles.constants.js';
import { ensure, seedId } from './context.js';

export async function seedMaster(db) {
  for (const param of CONFIG_DEFINITIONS.flatMap(group => group.params)) {
    await db.systemConfig.upsert({where:{key:param.key},update:{},create:{key:param.key,value:param.defaultValue}});
  }
  const oldRoles = await db.systemConfig.findUnique({where:{key:'ROLE_DEFINITIONS'}});
  const roles = Array.isArray(oldRoles?.value) ? oldRoles.value : [];
  const merged = [...roles,...BUILT_IN_ROLES.filter(role => !roles.some(old => old.code === role.code))];
  if (!oldRoles) await db.systemConfig.create({data:{key:'ROLE_DEFINITIONS',value:merged}});
  else if (merged.length !== roles.length) await db.systemConfig.update({where:{key:'ROLE_DEFINITIONS'},data:{value:merged}});
  const password = await bcrypt.hash(process.env.SEED_PASSWORD || 'DemoSinar2026!',10);
  const user = async (key,name,role,extra={}) => db.user.upsert({where:{email:`${key}.demo@sinaranugrah.test`},update:{},create:{id:seedId(key),name:`${name} (Demo)`,email:`${key}.demo@sinaranugrah.test`,password,role,roleCode:role,...extra}});
  const admin = await user('admin','Admin Operasional','ADMIN');
  const warehouse = await user('gudang','Kepala Gudang','KEPALA_GUDANG');
  const supervisors = [await user('spv-1','Supervisor Barat','SUPERVISOR'),await user('spv-2','Supervisor Timur','SUPERVISOR')];
  const drivers = [await user('supir-1','Supir Armada Satu','SUPIR'),await user('supir-2','Supir Armada Dua','SUPIR')];
  const division = await db.division.upsert({where:{code:'DEMO'},update:{},create:{id:seedId('division'),name:'DIVISI DEMO',code:'DEMO'}});
  const products = [];
  for (const [index,name,price] of [[1,'Nugget ayam 500 gram',35000],[2,'Sosis ayam 375 gram',24000],[3,'Kentang beku 1 kilogram',45000],[4,'Bakso ayam 500 gram',28000],[5,'Minuman kemasan 250 ml',5000],[6,'Biskuit keluarga 300 gram',18000]]) {
    products.push(await db.product.upsert({where:{sku:`DEMO-SKU-${index}`},update:{},create:{id:seedId(`product-${index}`),sku:`DEMO-SKU-${index}`,name:`${name} (Demo)`,price,stock:100,code:`DEMO-${index}`}}));
  }
  const sales = [], clusters = [], outlets = [];
  for (let i=0;i<5;i++) {
    const supervisor = supervisors[i<3?0:1];
    const member = await user(`sales-${i+1}`,['Budi','Siti','Agus','Dedi','Rina'][i],'SALES',{supervisorId:supervisor.id});
    sales.push(member);
    const cluster = await ensure(db,'cluster',`cluster-${i}`,{name:`Wilayah ${['Cimahi Utara','Cimahi Tengah','Padalarang','Lembang','Bandung Barat'][i]} (Demo)`,region:'Bandung Raya · Data contoh',supervisorId:supervisor.id,assignedSalesId:member.id,centerLat:-6.87+i*.01,centerLng:107.53+i*.01,colorHex:['#2563eb','#16a34a','#9333ea','#ea580c','#0891b2'][i],outletCount:10});
    clusters.push(cluster);
    // Fill missing assignments only. Existing transfers and user edits are preserved.
    await db.user.updateMany({where:{id:member.id,supervisorId:null},data:{supervisorId:supervisor.id}});
    await db.user.updateMany({where:{id:member.id,clusterId:null},data:{clusterId:cluster.id}});
    const group = [];
    for (let j=0;j<10;j++) {
      const statuses=['UNVALIDATED','LIKELY_VALID','WARNING','SUSPECT','UNVALIDATED','UNVALIDATED','UNVALIDATED','INCOMPLETE','UNVALIDATED','UNVALIDATED'];
      group.push(await ensure(db,'outlet',`outlet-${i}-${j}`,{name:`Toko ${['Mekar Jaya','Sumber Rezeki','Berkah','Sentosa','Harapan','Mandiri','Sejahtera','Pelangi','Rukun','Makmur'][j]} ${i+1} (Demo)`,address:`Alamat simulasi Jl. Distribusi ${i+1} No. ${j+1}, Bandung Raya`,clusterId:cluster.id,outletCode:`DEMO-${i+1}-${j+1}`,ownerName:`Pemilik contoh ${j+1}`,latitude:cluster.centerLat+j*.001,longitude:cluster.centerLng+j*.001,radiusMeters:50,outstanding:j===8?500000:0,lockStatus:j===8?'LOCKED':'NORMAL',validationStatus:statuses[j],validationDetails:{source:'DEMO_SIMULATION',note:'Contoh status; bukan hasil verifikasi Google atau bukti lokasi fisik.',coordinateHistory:[]},...(j===2?{googleSuggestedLat:cluster.centerLat+.0025,googleSuggestedLng:cluster.centerLng+.0025}:{}),paymentType:j%2?'TOP':'CASH',termOfPaymentDays:j%2?14:0,visitSchedule:{days:[1,2,3,4,5,6],weekType:'ALL'}}));
    }
    outlets.push(group);
    await ensure(db,'clusterRoute',`cluster-route-${i}`,{clusterId:cluster.id,routeIndex:1,isActive:true,totalDistanceKm:12,outletOrder:group.map(outlet=>outlet.id),startOutletId:group[0].id});
  }
  const vehicles = [];
  for (let i=0;i<3;i++) vehicles.push(await db.vehicle.upsert({where:{code:`DEMO-ARMADA-${i+1}`},update:{},create:{id:seedId(`vehicle-${i}`),code:`DEMO-ARMADA-${i+1}`,name:`Mobil distribusi ${i+1} (Demo)`,maxCartons:80,maxWeightKg:1000,fuelKmPerLiter:10,fuelType:'DIESEL',fuelPricePerLiter:10000,condition:i===2?'IN_SERVICE':'AVAILABLE',totalKm:1200}}));
  await ensure(db,'vehicleServiceRecord','vehicle-service',{vehicleId:vehicles[2].id,serviceDate:new Date(),workshopName:'Bengkel contoh',serviceType:'OIL_CHANGE',cost:450000,odometerAtService:1200,notes:'Data demo perawatan kendaraan'});
  // Repair only legacy seed accounts with no team; never transfer an assigned user.
  const legacySpv = await db.user.findUnique({where:{email:'spv@sinaranugrah.com'}});
  if (legacySpv?.role === 'SUPERVISOR' && !legacySpv.deletedAt) {
    await db.user.updateMany({where:{email:{in:['sales@sinaranugrah.com','siti@sinaranugrah.com','agus@sinaranugrah.com','dedi@sinaranugrah.com','rina@sinaranugrah.com']},role:'SALES',deletedAt:null,supervisorId:null},data:{supervisorId:legacySpv.id}});
    const members = await db.user.findMany({where:{supervisorId:legacySpv.id,deletedAt:null},select:{id:true,clusterId:true}});
    for (const member of members.filter(member=>member.clusterId)) await db.cluster.updateMany({where:{id:member.clusterId,supervisorId:null,deletedAt:null},data:{supervisorId:legacySpv.id}});
  }
  return {admin,warehouse,supervisors,drivers,sales,clusters,outlets,vehicles,products,division};
}
