import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prisma} from '../src/config/prisma.js';
import {attendanceException} from '../src/modules/absensi/services/attendance-policy.service.js';
test('attendance exception is specific to requester, outlet and future expiry',async t=>{
 const original=prisma.outletUnlockRequest.findFirst;let filter;
 prisma.outletUnlockRequest.findFirst=async({where})=>{filter=where;return {id:'approved'};};t.after(()=>{prisma.outletUnlockRequest.findFirst=original;});
 assert.equal(await attendanceException('outlet-1','sales-1'),true);
 assert.equal(filter.outletId,'outlet-1');assert.equal(filter.requestedBy,'sales-1');assert.equal(filter.status,'APPROVED');assert.ok(filter.expiresAt.gt instanceof Date);
});
test('missing, rejected or expired grants cannot authorize attendance',async t=>{
 const original=prisma.outletUnlockRequest.findFirst;prisma.outletUnlockRequest.findFirst=async()=>null;t.after(()=>{prisma.outletUnlockRequest.findFirst=original;});
 assert.equal(await attendanceException('outlet-1','sales-1'),false);
});
