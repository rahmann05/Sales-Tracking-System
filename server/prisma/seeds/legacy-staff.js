import {ensure,at,seedId} from './context.js';
import {seedWarehouse} from './warehouse.js';

export async function seedLegacyStaff(db,master,dateKey){
  const staff=await db.user.findMany({where:{deletedAt:null,email:{in:['admin@sinaranugrah.com','spv@sinaranugrah.com','kepalagudang@sinar.com','kepalagudang@sinaranugrah.com','supir@sinar.com','supir2@sinar.com','supir@sinaranugrah.com','supir2@sinaranugrah.com']}},orderBy:{email:'asc'}});
  for(const user of staff)await db.staffActivity.upsert({where:{userId_dateKey_activityKey:{userId:user.id,dateKey,activityKey:'SHIFT'}},update:{},create:{userId:user.id,dateKey,activityKey:'SHIFT',kind:'SHIFT',checkInAt:at(dateKey),notes:'Shift simulasi demo akun bawaan'}});
  const warehouse=staff.find(u=>u.role==='KEPALA_GUDANG');
  const drivers=staff.filter(u=>u.role==='SUPIR');
  if(!warehouse || !drivers.length)return;
  for(let index=0;index<drivers.length;index+=2){
    const pair=drivers.slice(index,index+2);if(pair.length===1)pair.push(pair[0]);
    const namespace=`legacy-${index/2}`;
    const vehicles=[];
    for(let v=0;v<3;v++)vehicles.push(await ensure(db,'vehicle',`${namespace}-vehicle-${v}`,{code:`DEMO-${namespace}-ARMADA-${v+1}`,name:`Armada akun bawaan ${index+v+1} (Demo)`,maxCartons:80,maxWeightKg:1000,fuelKmPerLiter:10,fuelType:'DIESEL',fuelPricePerLiter:10000,condition:'AVAILABLE',totalKm:1200}));
    await seedWarehouse(db,{...master,warehouse,drivers:pair,vehicles},dateKey,namespace);
    for(const driver of pair)await ensure(db,'notification',`${namespace}-${driver.id}-${dateKey}`,{userId:driver.id,title:'Rute uji pengiriman tersedia (Demo)',message:'Buka rute hari ini untuk menguji proses pengiriman.',type:'DELIVERY_ASSIGNED',payload:{source:'DEMO',seedBatch:seedId(`${namespace}-${dateKey}`)}});
  }
}
