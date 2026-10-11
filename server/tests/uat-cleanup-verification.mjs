import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prisma} from '../src/config/prisma.js';

assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const ledger=JSON.parse(fs.readFileSync('../docs/SYSTEM_T07_T09_SESSION_20261011.json'));
const tag=ledger.tag;
try{
 const [users,outlets,pjps,clusters,jobs,roleConfig,profile]=await Promise.all([
  prisma.user.count({where:{id:{in:ledger.userIds}}}),
  prisma.outlet.count({where:{id:{in:ledger.outletIds}}}),
  prisma.pjp.count({where:{id:{in:ledger.pjpIds}}}),
  prisma.cluster.count({where:{name:{startsWith:tag}}}),
  prisma.outletValidationJob.count({where:{actorId:{in:ledger.userIds}}}),
  prisma.systemConfig.findUnique({where:{key:'ROLE_DEFINITIONS'}}),
  prisma.systemConfig.count({where:{key:'_POLICY_PROFILE:TEAM:'+ledger.userIds[1]}}),
 ]);
 const customRoles=(roleConfig?.value||[]).filter(r=>r.code?.startsWith(tag.replaceAll('-','_')+'_')).length;
 const result={users,outlets,pjps,clusters,jobs,customRoles,profile};
 assert.deepEqual(result,{users:0,outlets:0,pjps:0,clusters:0,jobs:0,customRoles:0,profile:0});
 console.log('UAT fixture cleanup verified:',JSON.stringify(result));
}finally{await prisma.$disconnect();}
