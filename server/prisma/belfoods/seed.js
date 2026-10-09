import {ensure,id,note,email,people} from './context.js';
import {seedMaster} from './master.js';
import {seedSales} from './sales.js';
import {seedWarehouse} from './warehouse.js';
export async function seedBelfoods(db,date){
 const master=await seedMaster(db,date),sales=await seedSales(db,master,date);
 await seedWarehouse(db,master,sales,date);
 for(const [key] of people)await ensure(db,'notification',`welcome-${key}-${date}`,{userId:master.users[key].id,type:'SEED_INFORMATION',title:'Lingkungan uji Belfoods',message:'Master outlet berasal dari sampel callplan. Aktivitas dan nominal adalah skenario uji. GPS live baru tersedia dari perangkat.',payload:{source:'BELFOODS_UAT_SIMULATION'}});
 await db.systemConfig.upsert({where:{key:'BELFOODS_UAT_SEED'},update:{},create:{key:'BELFOODS_UAT_SEED',value:{version:1,date,source:master.source.source,sourceSummary:master.source.summary,outlets:master.source.outlets.map(r=>r.customer_id),accounts:people.map(([key,,role])=>({email:email(key),role})),note}}});
 await ensure(db,'auditEvent',`seed-${date}`,{actorId:master.users.admin.id,actorName:master.users.admin.name,action:'SEED_BELFOODS_UAT',entityType:'SEED',entityId:id('seed'),before:{source:'fresh-or-additive-seed'},after:{date,sourceRows:443,selectedOutlets:20,note}});
 return {date,users:people.length,outlets:20,orders:sales.orders.length};
}
