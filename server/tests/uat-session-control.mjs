import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prisma} from '../src/config/prisma.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const ledger=JSON.parse(fs.readFileSync('../docs/SYSTEM_T07_T09_SESSION_20261011.json'));
try{
 const prefix=process.argv[2];
 assert.ok(['sales','supervisor','custom','custom-admin','custom-supervisor','custom-kepala_gudang','custom-supir','admin','sequence-free'].includes(prefix));
 if(prefix==='sequence-free'){
  const supervisor=await prisma.user.findUniqueOrThrow({where:{email:`supervisor-${ledger.tag.toLowerCase()}@example.invalid`}});
  assert.ok(ledger.userIds.includes(supervisor.id));
  const key='_POLICY_PROFILE:TEAM:'+supervisor.id;
  const profile=await prisma.systemConfig.findUniqueOrThrow({where:{key}});
  const values={...profile.value.versions[0].values,ATTENDANCE_ENFORCE_SEQUENCE:false};
  await prisma.systemConfig.update({where:{key},data:{value:{versions:[{...profile.value.versions[0],revision:profile.value.versions[0].revision+1,values}]}}});
  console.log('Fixture visit sequence disabled:',ledger.tag);
  process.exit(0);
 }
 const user=await prisma.user.findUniqueOrThrow({where:{email:`${prefix}-${ledger.tag.toLowerCase()}@example.invalid`}});
 assert.ok(ledger.userIds.includes(user.id));
 const permissions=prefix==='custom-kepala_gudang'?{can_monitor_delivery:false}:prefix==='custom-supir'?{can_access_driver_map:false}:undefined;
 await prisma.user.update({where:{id:user.id},data:{tokenVersion:{increment:1},...(permissions?{permissions}:{})}});
 console.log('Fixture session revoked:',prefix);
}finally{await prisma.$disconnect();}
