import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {previewRjpImport} from '../src/modules/clusters/services/rjp-import-preview.service.js';
import {importRjp} from '../src/modules/clusters/services/import-rjp.service.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag=`import-options-${randomUUID()}`,ids=[];let cluster,admin,checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
try{
 admin=await prisma.user.create({data:{name:tag,email:`${tag}@example.invalid`,password:'unused',role:'ADMIN'}});
 cluster=await prisma.cluster.create({data:{code:tag,name:tag,region:'Test'}});
 const old=await prisma.outlet.create({data:{name:'Sebelum',outletCode:tag,clusterId:cluster.id,address:'Alamat lama',latitude:-6,longitude:107}});ids.push(old.id);
 const row={clusterName:tag,clusterCode:tag,outletCode:tag,customerName:'Sesudah',address:'Alamat baru',area:'Test',latitude:-6.9,longitude:107.6,importAction:'CREATE_ONLY'};
 const skipped=await previewRjpImport([row],admin);eq(skipped.summary.skipped,1);
 const skipResult=await importRjp([row],admin,skipped.token);eq(skipResult.importedOutletsCount,0);eq((await prisma.outlet.findUnique({where:{id:old.id}})).name,'Sebelum');
 const missing={...row,outletCode:`${tag}-absent`,importAction:'UPDATE_ONLY'};
 const noCreate=await previewRjpImport([missing],admin);await importRjp([missing],admin,noCreate.token);eq(await prisma.outlet.count({where:{outletCode:missing.outletCode}}),0);
 const update={...row,importAction:'UPDATE_ONLY'},review=await previewRjpImport([update],admin);eq(review.summary.updated,1);
 await assert.rejects(()=>importRjp([update],admin,skipped.token),e=>e.statusCode===409);checks++;
 await assert.rejects(()=>importRjp([update],admin),e=>e.statusCode===409);checks++;
 const result=await importRjp([update],admin,review.token);eq(result.importedOutletsCount,1);eq((await prisma.outlet.findUnique({where:{id:old.id}})).name,'Sesudah');eq(await prisma.outletChange.count({where:{outletId:old.id}}),1);
 const replay=await importRjp([update],admin,review.token);eq(replay,result);eq(await prisma.outletChange.count({where:{outletId:old.id}}),1);
 await assert.rejects(()=>importRjp([{...update,customerName:'Payload berbeda'}],admin,review.token),e=>e.statusCode===409);checks++;
 const fresh=await previewRjpImport([update],admin);
 await prisma.outlet.update({where:{id:old.id},data:{name:'Perubahan serentak'}});
 await assert.rejects(()=>importRjp([update],admin,fresh.token),e=>e.statusCode===409);checks++;
 eq((await prisma.outlet.findUnique({where:{id:old.id}})).name,'Perubahan serentak');
 console.log(`Import options integration passed: ${checks} assertions`);
}finally{
 if(admin)await prisma.auditEvent.deleteMany({where:{actorId:admin.id,entityType:'RJP_IMPORT'}});
 await prisma.outletChange.deleteMany({where:{outletId:{in:ids}}});
 await prisma.outlet.deleteMany({where:{id:{in:ids}}});
 if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});
 if(admin)await prisma.user.delete({where:{id:admin.id}});
 await prisma.$disconnect();
}
