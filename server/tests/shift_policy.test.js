import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shiftDateKey,shiftLateMinutes,shiftTimeView,validateShiftCorrection} from '../../shared/shift-policy.mjs';
import {policyConflicts} from '../../shared/operational-policy.mjs';
import {reviewIdentity} from '../src/modules/config/services/approval-readiness.service.js';

test('shift business day supports WIB midnight and configured night-shift cutoff',()=>{
 assert.equal(shiftDateKey('2026-10-09T17:00:00Z'),'2026-10-10');
 assert.equal(shiftDateKey('2026-10-09T19:00:00Z','06:00'),'2026-10-09');
 assert.equal(shiftDateKey('2026-10-09T23:00:00Z','06:00'),'2026-10-10');
 assert.equal(shiftLateMinutes('2026-10-09T15:12:00Z','2026-10-09',{SHIFT_START_TIME:'22:00',SHIFT_LATE_TOLERANCE_MINUTES:5}),7);
 assert.ok(policyConflicts({SHIFT_DAY_CUTOFF_TIME:'09:00',SHIFT_START_TIME:'08:00'}).some(s=>s.includes('Pergantian')));
});
test('corrections retain original evidence and optional attendance never becomes on-time',()=>{
 const row={checkInAt:'2026-10-10T02:00:00Z',checkOutAt:null,lateMinutes:60,timeCorrection:{accepted:{checkInAt:'2026-10-10T01:00:00Z',checkOutAt:'2026-10-10T02:00:00Z',lateMinutes:0}}};
 assert.deepEqual(shiftTimeView(row),{actualIn:row.checkInAt,actualOut:null,reportedIn:row.timeCorrection.accepted.checkInAt,reportedOut:row.timeCorrection.accepted.checkOutAt,corrected:true,lateMinutes:0});
 assert.equal(row.checkOutAt,null);
 assert.equal(shiftTimeView({...row,checklist:{startKind:'BUSINESS_START'},timeCorrection:null}).actualIn,null);
 assert.equal(shiftTimeView({...row,checklist:{startKind:'BUSINESS_START'},timeCorrection:null}).lateMinutes,null);
});
test('corrections reject other business days, future/reversed/long times, old and non-attendance shifts',()=>{
 const row={kind:'SHIFT',dateKey:'2026-10-09',checkInAt:'2026-10-09T15:10:00Z',policySnapshot:{values:{SHIFT_ATTENDANCE_MODE:'IN_OUT',SHIFT_START_TIME:'22:00',SHIFT_DAY_CUTOFF_TIME:'06:00'}}};
 const values={SHIFT_CORRECTION_MAX_AGE_DAYS:1,SHIFT_CORRECTION_MAX_DURATION_HOURS:12,SHIFT_DAY_CUTOFF_TIME:'00:00'},now=Date.parse('2026-10-10T05:00:00Z');
 const data={checkInAt:'2026-10-09T15:00:00Z',checkOutAt:'2026-10-09T23:00:00Z'};
 assert.equal(validateShiftCorrection(row,data,values,now).lateMinutes,0);
 for(const patch of [{checkInAt:'2026-10-10T01:00:00Z'},{checkOutAt:'2026-10-10T06:00:00Z'},{checkOutAt:'2026-10-09T14:00:00Z'},{checkInAt:'bad'}])assert.throws(()=>validateShiftCorrection(row,{...data,...patch},values,now));
 assert.throws(()=>validateShiftCorrection(row,data,{...values,SHIFT_CORRECTION_MAX_DURATION_HOURS:1},now),/durasi/);
 assert.throws(()=>validateShiftCorrection(row,data,{...values,SHIFT_CORRECTION_MAX_AGE_DAYS:0},now),/tanggal koreksi/);
 assert.throws(()=>validateShiftCorrection({...row,checklist:{startKind:'BUSINESS_START'}},data,values,now),/presensi/);
 assert.throws(()=>validateShiftCorrection({...row,policySnapshot:{values:{SHIFT_ATTENDANCE_MODE:'IN_ONLY'}}},data,values,now),/masuk saja/);
});
test('existing system templates inherit newly registered permissions but explicit denial survives',()=>{
 const roles=[{code:'ADMIN',isSystem:true,defaultPermissions:{can_propose_shift_correction:false}}];
 const person=reviewIdentity({id:'a',role:'ADMIN',permissions:{}},roles);
 assert.equal(person.permissions.can_propose_shift_correction,false);assert.equal(person.permissions.can_review_shift_correction,true);
 assert.equal(reviewIdentity({id:'b',role:'ADMIN',permissions:{can_review_shift_correction:false}},roles).permissions.can_review_shift_correction,false);
 const custom=reviewIdentity({id:'c',role:'ADMIN',roleCode:'CUSTOM',permissions:{}},[{code:'CUSTOM',baseRole:'ADMIN',isSystem:false,defaultPermissions:{}}]);
 assert.equal(custom.permissions.can_review_shift_correction,undefined);
});
