import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prisma} from '../src/config/prisma.js';
import {completeFollowUp,reviewFollowUp} from '../src/modules/staff-attendance/follow-up.service.js';
import {paginateAttention} from '../../shared/attention-queue.mjs';
function fixture(t){
 const record={id:'task',userId:'spv',followUp:{status:'OPEN',ownerId:'sales',dueDate:'2026-10-01',history:[]}};
 const original=prisma.$transaction;prisma.$transaction=async work=>work({$executeRaw:async()=>{},notification:{createMany:async()=>({count:1})},user:{findFirst:async()=>({id:'sales',supervisorId:'spv'}),findMany:async()=>[{id:'admin'}]},staffActivity:{findFirst:async()=>record,update:async({data})=>{record.followUp=data.followUp;return structuredClone(record);}}});
 t.after(()=>{prisma.$transaction=original;});return record;
}
test('sending evidence does not complete a task until a different reviewer accepts',async t=>{
 const record=fixture(t);const result=await completeFollowUp('task',{id:'sales',role:'SALES'},'Hasil lengkap','Referensi komunikasi');
 assert.equal(result.followUp.status,'SUBMITTED');assert.equal(result.followUp.completedAt,undefined);
 const done=await reviewFollowUp('task',{id:'spv',role:'SUPERVISOR'},{decision:'ACCEPT',note:'Bukti diperiksa',submissionId:result.followUp.submission.id});
 assert.equal(done.followUp.status,'DONE');assert.equal(done.followUp.completedBy,'spv');assert.equal(record.followUp.history.length,2);
});
test('submission requires evidence and cannot be sent by a different PIC',async t=>{
 fixture(t);await assert.rejects(()=>completeFollowUp('task',{id:'sales',role:'SALES'},'Hasil'),e=>e.statusCode===400);
 await assert.rejects(()=>completeFollowUp('task',{id:'spv',role:'SUPERVISOR'},'Hasil','Bukti'),e=>e.statusCode===403);
});
test('review returns preserve earlier evidence and reject decisions for stale submissions',async t=>{
 fixture(t);const first=await completeFollowUp('task',{id:'sales',role:'SALES'},'Hasil awal','Bukti awal');
 const returned=await reviewFollowUp('task',{id:'spv',role:'SUPERVISOR'},{decision:'RETURN',note:'Lengkapi tanggal',submissionId:first.followUp.submission.id});
 assert.equal(returned.followUp.status,'OPEN');assert.equal(returned.followUp.submission.evidence,'Bukti awal');
 const second=await completeFollowUp('task',{id:'sales',role:'SALES'},'Hasil baru','Bukti baru');
 assert.notEqual(first.followUp.submission.id,second.followUp.submission.id);
 await assert.rejects(()=>reviewFollowUp('task',{id:'spv',role:'SUPERVISOR'},{decision:'ACCEPT',note:'Stale',submissionId:first.followUp.submission.id}),e=>e.statusCode===409);
});
test('even an Admin cannot approve their own result and a review requires a reason',async t=>{
 const record=fixture(t);record.followUp.ownerId='admin';
 const result=await completeFollowUp('task',{id:'admin',role:'ADMIN'},'Hasil','Bukti');
 await assert.rejects(()=>reviewFollowUp('task',{id:'admin',role:'ADMIN'},{decision:'ACCEPT',note:'Self',submissionId:result.followUp.submission.id}),e=>e.statusCode===403);
 await assert.rejects(()=>reviewFollowUp('task',{id:'other',role:'ADMIN'},{decision:'RETURN',note:' ',submissionId:result.followUp.submission.id}),e=>e.statusCode===400);
});
test('a second decision cannot overwrite an accepted review',async t=>{
 fixture(t);const result=await completeFollowUp('task',{id:'sales',role:'SALES'},'Hasil','Bukti');
 const request={decision:'ACCEPT',note:'Diperiksa',submissionId:result.followUp.submission.id};
 await reviewFollowUp('task',{id:'spv',role:'SUPERVISOR'},request);
 await assert.rejects(()=>reviewFollowUp('task',{id:'spv',role:'SUPERVISOR'},request),e=>e.statusCode===409);
});
test('submitted tasks remain visible in the review queue without showing as unfinished sales work',()=>{
 const result=paginateAttention([{key:'task',category:'VISIT',status:'SUBMITTED',dueDate:'2026-10-01',since:'2026-10-01',ownerId:'sales'}],{filter:'REVIEW'},Date.parse('2026-10-08T10:00:00Z'));
 assert.equal(result.total,1);assert.equal(result.summary.awaitingReview,1);assert.equal(result.summary.overdue,0);
});
import {useDefaultPolicy} from './helpers/config-fixture.js';
useDefaultPolicy();
