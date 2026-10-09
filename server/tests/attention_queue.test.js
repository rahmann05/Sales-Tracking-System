import {test} from 'node:test';
import assert from 'node:assert/strict';
import {attentionState,paginateAttention} from '../../shared/attention-queue.mjs';
import {getAttention} from '../src/modules/attention/attention.service.js';
import {prisma} from '../src/config/prisma.js';
import {invalidateConfigCache} from '../src/modules/config/services/dynamic-config.service.js';
const now=Date.parse('2026-10-08T10:00:00+07:00');
const row=(key,extra={})=>({key,category:'ORDER',since:'2026-10-01T00:00:00Z',...extra});
test('an old record without a deadline is unscheduled rather than overdue',()=>{
 const state=attentionState(row('old'),now);assert.equal(state.overdue,false);assert.equal(state.missingDeadline,true);assert.equal(state.missingOwner,true);
});
test('date-only visit deadlines expire at the end of the WIB day',()=>{
 assert.equal(attentionState(row('today',{dueDate:'2026-10-08'}),now).overdue,false);
 assert.equal(attentionState(row('yesterday',{dueDate:'2026-10-07'}),now).overdue,true);
 assert.equal(attentionState(row('today',{dueDate:'2026-10-08'}),Date.parse('2026-10-08T17:00:00Z')).overdue,true);
});
test('overdue and module filters apply before pagination with full queue counts',()=>{
 const rows=Array.from({length:70},(_,i)=>row(`o:${i}`,{dueAt:'2026-10-09T00:00:00Z'}));
 rows.push(row('late',{category:'VISIT',dueDate:'2026-10-07',ownerId:'sales'}));
 const result=paginateAttention(rows,{page:1,limit:25,filter:'OVERDUE',category:'VISIT'},now);
 assert.equal(result.summary.total,71);assert.equal(result.total,1);assert.equal(result.rows[0].key,'late');
});
test('earliest overdue work is sorted first and untimed work remains visible',()=>{
 const result=paginateAttention([row('unscheduled'),row('late2',{dueDate:'2026-10-07'}),row('late1',{dueAt:'2026-10-06T00:00:00Z'})],{},now);
 assert.deepEqual(result.rows.map(r=>r.key),['late1','late2','unscheduled']);
});
test('fulfilled or cancelled demand is excluded but unresolved order history remains',async t=>{
 const originals=[];
 const mock=(model,result)=>{const original=prisma[model].findMany;originals.push(()=>{prisma[model].findMany=original;});prisma[model].findMany=async()=>result;};
 t.after(()=>{originals.forEach(restore=>restore());invalidateConfigCache();});
 const order=(id,cancelledQuantity)=>({id,status:'APPROVED',items:[{id:`i:${id}`,quantity:1,cancelledQuantity}],createdAt:new Date(),pjpStop:{outlet:{name:'Toko'}}});
 mock('order',[order('cancelled',1),order('open',0)]);for(const model of ['packingList','deliveryRoute','deliveryIssue','staffActivity','user','systemConfig','attendance','offPjpAttendance','outletUnlockRequest','routeChangeRequest','operationalException'])mock(model,[]);invalidateConfigCache();
 const result=await getAttention({id:'admin',role:'ADMIN'});assert.deepEqual(result.rows.map(r=>r.key),['order:open']);
});
