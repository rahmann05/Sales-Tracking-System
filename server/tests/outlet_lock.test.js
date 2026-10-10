import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prisma} from '../src/config/prisma.js';
import {attendanceException} from '../src/modules/absensi/services/attendance-policy.service.js';
test('attendance exception is specific to requester, outlet and future expiry',async t=>{
 const original=prisma.outletUnlockRequest.findMany;let filter;
 prisma.outletUnlockRequest.findMany=async({where})=>{filter=where;return [{id:'approved'}];};t.after(()=>{prisma.outletUnlockRequest.findMany=original;});
 assert.equal(await attendanceException('outlet-1','sales-1'),true);
 assert.equal(filter.outletId,'outlet-1');assert.equal(filter.requestedBy,'sales-1');assert.equal(filter.status,'APPROVED');assert.ok(filter.expiresAt.gt instanceof Date);
});
test('missing, rejected or expired grants cannot authorize attendance',async t=>{
 const original=prisma.outletUnlockRequest.findMany;prisma.outletUnlockRequest.findMany=async()=>[];t.after(()=>{prisma.outletUnlockRequest.findMany=original;});
 assert.equal(await attendanceException('outlet-1','sales-1'),false);
});
