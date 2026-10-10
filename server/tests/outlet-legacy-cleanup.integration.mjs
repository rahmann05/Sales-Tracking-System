import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {prisma} from '../src/config/prisma.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
let outlet,review,run,audit,unrelated,checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const invoke=(args=[])=>spawnSync(process.execPath,['prisma/outletMigrationPreflight.mjs',...args],{encoding:'utf8'});
try{
 const cluster=await prisma.cluster.findFirst({where:{deletedAt:null}});assert.ok(cluster);
 const proof={source:'FIELD',photoUrl:'internal-photo',latitude:-6.9,longitude:107.6},details={method:'LEGACY',score:88,qualityConfirmed:{source:'FIELD',name:'Toko Fixture',address:'Jl Melati No 12'},signals:{findPlace:{score:90,details:{placeId:'legacy-keep',googlePlaceName:'Provider description',googleAddress:'Provider address',googleLat:-6.91,googleLng:107.61,outletName:'Toko Fixture'}}}};
 outlet=await prisma.outlet.create({data:{name:'Toko Fixture',outletCode:randomUUID(),address:'Jl Melati No 12',latitude:-6.9,longitude:107.6,clusterId:cluster.id,locationEvidence:proof,validationDetails:details,googleSuggestedLat:-6.91,googleSuggestedLng:107.61}});
 review=await prisma.outletReview.create({data:{outletId:outlet.id,reason:'Fixture legacy retention',requestedBy:{id:'SYSTEM'},decision:{action:'KEEP',actor:{name:'Reviewer'},reason:'Internal decision remains'}}});
 run=await prisma.outletValidationRun.create({data:{reviewId:review.id,snapshot:{name:outlet.name,address:outlet.address,latitude:outlet.latitude,longitude:outlet.longitude},result:details,actor:{id:'SYSTEM'},providerContent:{candidates:[{placeId:'legacy-keep',name:'Provider description',latitude:-6.91,longitude:107.61}]},providerExpiresAt:new Date(Date.now()-86400000)}});
 audit=await prisma.auditEvent.create({data:{entityType:'OUTLET_VALIDATION',entityId:outlet.id,action:'LEGACY_CHECK',before:{},after:{validationDetails:details,field:proof},archivedAt:new Date()}});
 unrelated=await prisma.auditEvent.create({data:{entityType:'ORDER',entityId:randomUUID(),action:'FIXTURE',before:{},after:{photos:['internal-business-proof']}}});
 const dry=invoke();eq(dry.status,0);const plan=JSON.parse(dry.stdout);eq(plan.mode,'DRY_RUN');assert.ok(plan.cleanup.Outlet>=1&&plan.cleanup.OutletValidationRun>=1&&plan.cleanup.AuditEvent>=1);checks++;
 eq((await prisma.outlet.findUnique({where:{id:outlet.id}})).validationDetails,details);
 const refused=invoke(['--apply','--confirm=wrong-digest']);eq(refused.status,1);eq((await prisma.outlet.findUnique({where:{id:outlet.id}})).googleSuggestedLat,-6.91);
 const applied=invoke(['--apply',`--confirm=${plan.digest}`]);if(applied.status!==0)throw Error(applied.stderr);eq(applied.status,0);
 const current=await prisma.outlet.findUnique({where:{id:outlet.id}});eq(current.latitude,outlet.latitude);eq(current.longitude,outlet.longitude);eq(current.name,outlet.name);eq(current.address,outlet.address);eq(current.locationEvidence,proof);eq(current.googleSuggestedLat,null);eq(current.googleSuggestedLng,null);eq(current.validationDetails.signals.findPlace.details.placeId,'legacy-keep');eq(current.validationDetails.signals.findPlace.details.googleAddress,undefined);eq(current.validationDetails.qualityConfirmed,details.qualityConfirmed);
 const cleanedRun=await prisma.outletValidationRun.findUnique({where:{id:run.id}});eq(cleanedRun.snapshot,run.snapshot);eq(cleanedRun.result.score,88);eq(cleanedRun.providerContent,null);eq(cleanedRun.providerExpiresAt,null);
 const cleanedAudit=await prisma.auditEvent.findUnique({where:{id:audit.id}});eq(cleanedAudit.after.field,proof);assert.ok(cleanedAudit.archivedAt);checks++;
 eq((await prisma.outletReview.findUnique({where:{id:review.id}})).decision,review.decision);eq((await prisma.auditEvent.findUnique({where:{id:unrelated.id}})).after,{photos:['internal-business-proof']});
 const repeated=invoke();eq(repeated.status,0);eq(Object.values(JSON.parse(repeated.stdout).cleanup).every(n=>n===0),true);
 console.log(`Legacy provider cleanup integration passed: ${checks} assertions; dry-run, wrong-digest rejection, apply and idempotence; native/field/archived business evidence preserved.`);
}finally{
 await prisma.auditEvent.deleteMany({where:{id:{in:[audit?.id,unrelated?.id].filter(Boolean)}}});
 if(run)await prisma.outletValidationRun.delete({where:{id:run.id}});if(review)await prisma.outletReview.delete({where:{id:review.id}});if(outlet)await prisma.outlet.delete({where:{id:outlet.id}});
 await prisma.$disconnect();
}
