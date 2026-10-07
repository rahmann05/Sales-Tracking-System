import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {CODE_ENTITIES,codePolicy} from '../../shared/coding.mjs';
import {reserveCodeNumber} from '../src/modules/config/services/business-code.service.js';

const key=`VERIFY_${randomUUID()}`;
const policy={...codePolicy('NOO'),reset:'NONE',start:1};
try {
  for(const entity of CODE_ENTITIES) await prisma[entity.model].findFirst({select:{id:true,[entity.field]:true}});
  const numbers=await Promise.all(Array.from({length:20},()=>reserveCodeNumber(key,policy,new Date())));
  assert.deepEqual(numbers.sort((a,b)=>a-b),Array.from({length:20},(_,i)=>i+1));
  assert.equal(await reserveCodeNumber(key,{...policy,start:100},new Date()),100);
  assert.equal(await reserveCodeNumber(key,{...policy,start:1},new Date()),101);
  console.log('13 code fields verified; 20 simultaneous database reservations unique; start cannot rewind.');
} finally {
  await prisma.systemConfig.deleteMany({where:{key:{startsWith:`_CODE_COUNTER:${key}:`}}});
  await prisma.$disconnect();
}
