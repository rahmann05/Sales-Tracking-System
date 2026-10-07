import {test} from 'node:test';
import assert from 'node:assert/strict';
import {monthWorkingDays,workingDays} from '../../shared/working-calendar.mjs';
import {routeRecords} from '../src/modules/clusters/services/cluster-assignment-policy.service.js';
import {validate} from '../src/middlewares/validate.middleware.js';
import {z} from 'zod';

test('working calendar includes configured Sundays and preserves future zero elapsed days',()=>{
  assert.deepEqual(workingDays('6,0,1,1'),[1,6,0]);
  assert.deepEqual(monthWorkingDays(2026,2,'0','2026-02-08'),{total:4,elapsed:2});
  assert.deepEqual(monthWorkingDays(2026,2,'1,2,3,4,5,6','2026-01-30'),{total:24,elapsed:0});
  assert.deepEqual(monthWorkingDays(2026,2,'0,1,2,3,4,5,6','2026-03-01'),{total:28,elapsed:28});
});
test('reference routes reject foreign or duplicate outlets and conflicting active routes',()=>{
  const allowed=new Set(['a','b']);
  const good={isActive:true,outletOrder:[{id:'b'},'a'],startOutletId:'b',totalDistanceKm:3};
  assert.deepEqual(routeRecords('cluster',[good],allowed)[0].outletOrder,[{id:'b',sequence:1},{id:'a',sequence:2}]);
  assert.throws(()=>routeRecords('cluster',[{...good,outletOrder:['foreign']}],allowed));
  assert.throws(()=>routeRecords('cluster',[{...good,outletOrder:['a','a']}],allowed));
  assert.throws(()=>routeRecords('cluster',[good,good],allowed));
});
test('request middleware forwards parsed defaults and removes unrecognized mutation fields',()=>{
  const req={body:{name:'Valid',deletedAt:'spoofed'},params:{},query:{}};
  let error;
  validate(z.object({body:z.object({name:z.string(),enabled:z.boolean().default(false)})}))(req,{},e=>{error=e;});
  assert.equal(error,undefined);
  assert.deepEqual(req.body,{name:'Valid',enabled:false});
});

test('forward geocoding and nearby place selection call their normalization services',async t=>{
  const {runForwardGeocode,runFindPlace}=await import('../src/modules/outlets/services/outlet-validation.helpers.js');
  let requested='';
  t.mock.method(globalThis,'fetch',async url=>{requested=url;return {json:async()=>({status:'OK',results:[{name:'Toko Azka',formatted_address:'Alamat Bandung',vicinity:'Bandung',geometry:{location:{lat:-6.9,lng:107.6}}}]})};});
  const forward=await runForwardGeocode('Jl Bandung No 1','test-key');
  assert.equal(forward.success,true);
  assert.ok(requested.includes('address='));
  const nearby=await runFindPlace('Toko Aska','Alamat Bandung','test-key',-6.9,107.6);
  assert.equal(nearby.success,true);
  assert.equal(nearby.source,'nearby_proximity');
});
