import 'dotenv/config';
import {PrismaClient} from '@prisma/client';
import {seedHistoricalFleet} from './belfoods/fleet.js';
const db=new PrismaClient();
try{
 const host=new URL(process.env.DATABASE_URL).hostname;
 if(!['localhost','127.0.0.1','[::1]'].includes(host))throw new Error('Import ini hanya untuk database lokal. Gunakan proses rilis yang disetujui untuk produksi.');
 const result=await db.$transaction(async tx=>{
  const imported=await seedHistoricalFleet(tx);
  const admin=await tx.user.findFirst({where:{role:'ADMIN',deletedAt:null},select:{id:true,name:true}});
  if(admin&&imported.created)await tx.auditEvent.create({data:{actorId:admin.id,actorName:admin.name,action:'IMPORT_HISTORICAL_FLEET',entityType:'VEHICLE',entityId:'historical-mix',before:{source:'USER_HISTORICAL_DRIVER_HELPER_MIX',existingVehiclesOverwritten:false},after:{...imported,source:'USER_HISTORICAL_DRIVER_HELPER_MIX',capacityStatus:'UNVERIFIED',overwritten:false}}});
  return imported;
 });
 console.log(JSON.stringify(result));
}finally{await db.$disconnect();}
