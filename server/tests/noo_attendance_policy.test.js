import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/prisma.js';
import { invalidateConfigCache } from '../src/modules/config/services/dynamic-config.service.js';
import { searchPlaces } from '../src/modules/customer-registrations/services/search-places.service.js';
import { validateGooglePlace } from '../src/modules/customer-registrations/services/validate-google-place.service.js';
import { createRegistration } from '../src/modules/customer-registrations/services/create-registration.service.js';
import { checkIn } from '../src/modules/absensi/services/check-in.service.js';
import { checkOut } from '../src/modules/absensi/services/check-out.service.js';
import { validateConfigMap } from '../src/modules/config/services/validate-config.service.js';

function mock(t, target, key, fn) {
  const original = target[key]; target[key] = fn;
  t.after(() => { target[key] = original; invalidateConfigCache(); });
}
function configs(t, values) {
  values = { ATTENDANCE_REQUIRE_PHOTO:false, ...values };
  mock(t, prisma.systemConfig, 'findMany', async () => Object.entries(values).map(([key,value]) => ({key,value})));
  invalidateConfigCache();
}
function attendanceDb(t, { ageMs = 60000, active = false, sequence = 1, radius = 50 } = {}) {
  const stop = { id:'stop', pjpId:'pjp', sequence, status:'PENDING', outlet:{id:'outlet',latitude:-6,longitude:107,radiusMeters:radius}, pjp:{userId:'sales',date:new Date(),stops:[{id:'previous',sequence:1,status:'PENDING'}]}, attendances:[] };
  const created = [];
  const db = {
    $executeRaw: async () => 1,
    pjpStop: {findUnique:async () => stop, update:async () => ({}),findMany:async () => []},
    attendance: {findFirst:async () => active ? {id:'active'} : null,create:async ({data}) => {created.push(data);return data;}},
    user: {findUnique:async () => ({email:'sales@example.test'})},
    outletUnlockRequest: {findFirst:async () => null},
    pjp: {update:async () => ({})},
  };
  mock(t, prisma, '$transaction', async fn => fn(db));
  return {stop,created, addIn:() => {stop.attendances=[{type:'IN',userId:'sales',timestamp:new Date(Date.now()-ageMs)}];}};
}

test('NOO radius applies equally to Google and OSM, supports custom radius and off', async t => {
  for (const provider of ['google','osm']) {
    for (const [enabled,radius,count] of [[true,100,0],[true,500,1],[false,100,1]]) {
      configs(t, {MAPS_API_KEY:'test',CUSTOMER_REG_ENFORCE_PLACES_RADIUS:enabled,CUSTOMER_REG_PLACES_RADIUS_METERS:radius});
      mock(t, globalThis, 'fetch', async url => ({json:async () => String(url).includes('googleapis')
        ? {results:provider==='google' ? [{place_id:'g1',name:'Toko',geometry:{location:{lat:-6.002,lng:107}}}] : []}
        : provider==='osm' ? [{osm_id:1,lat:'-6.002',lon:'107',display_name:'Toko',address:{}}] : []}));
      const results = await searchPlaces('Toko',-6,107);
      assert.equal(results.length,count,`${provider}, radius ${radius}, enabled ${enabled}`);
      if (count) assert.ok(results[0].distanceMeters > 100);
    }
  }
});

test('NOO automatic verification cannot label an outside candidate as verified while radius is on', async t => {
  configs(t,{MAPS_API_KEY:'test'});
  mock(t,globalThis,'fetch',async () => ({json:async () => ({candidates:[{place_id:'remote',name:'Toko',geometry:{location:{lat:-6.002,lng:107}}}]})}));
  assert.equal((await validateGooglePlace('Toko','Alamat',-6,107)).isPlaceFound,false);
  configs(t,{MAPS_API_KEY:'test',CUSTOMER_REG_ENFORCE_PLACES_RADIUS:false});
  assert.equal((await validateGooglePlace('Toko','Alamat',-6,107)).placeId,'remote');
});

test('NOO attachment policy is enforced by server and can be disabled', async t => {
  configs(t,{});
  await assert.rejects(createRegistration({name:'Toko'}, {id:'sales'}),/Foto fisik/);
  await assert.rejects(createRegistration({name:'Toko',photoUrl:'photo'}, {id:'sales'}),/dokumen KTP/);
  configs(t,{CUSTOMER_REG_REQUIRE_PHOTO:false,CUSTOMER_REG_REQUIRE_TAX_DOCUMENT:false,CODE_NOO_MODE:'MANUAL'});
  mock(t,prisma.customerRegistration,'findFirst',async () => null);
  mock(t,prisma.customerRegistration,'create',async ({data}) => ({...data,id:'reg'}));
  mock(t,prisma.user,'findUnique',async () => ({}));
  mock(t,prisma.user,'findMany',async () => []);
  mock(t,globalThis,'fetch',async () => ({json:async () => ({candidates:[]})}));
  mock(t,prisma.outlet,'findMany',async()=>[]);
  mock(t,prisma.user,'findFirst',async()=>({id:'sales',role:'SALES'}));
  mock(t,prisma,'$transaction',async fn=>fn({...prisma,$executeRaw:async()=>1}));
  assert.equal((await createRegistration({name:'Toko',address:'Alamat',latitude:-6,longitude:107,registrationCode:'NOO-TEST'}, {id:'sales',name:'Sales'})).registrationStatus,'SUBMITTED');
});

test('check-in geofence on blocks; off accepts and preserves GPS WARNING', async t => {
  configs(t,{}); const {created} = attendanceDb(t);
  await assert.rejects(checkIn('stop','sales',-6.002,107),{statusCode:422});
  configs(t,{ATTENDANCE_ENFORCE_GEOFENCE:false});
  const record = await checkIn('stop','sales',-6.002,107);
  assert.equal(record.distanceWarning,'WARNING'); assert.equal(created.length,1);
});

test('required attendance photos are enforced on both IN and OUT', async t => {
  configs(t,{ATTENDANCE_REQUIRE_PHOTO:true}); const {addIn}=attendanceDb(t);
  await assert.rejects(checkIn('stop','sales',-6,107),/Foto absen masuk/);
  assert.equal((await checkIn('stop','sales',-6,107,'photo')).photoUrl,'photo');
  addIn();
  await assert.rejects(checkOut('stop','sales',-6,107),/Foto absen keluar/);
  assert.equal((await checkOut('stop','sales',-6,107,'photo',{earlyReason:'Darurat'})).photoUrl,'photo');
});

test('global radius can override outlet radius; sequence off permits later stops', async t => {
  configs(t,{ATTENDANCE_RADIUS_METERS:500}); attendanceDb(t,{sequence:2});
  await assert.rejects(checkIn('stop','sales',-6.002,107),{statusCode:422});
  configs(t,{ATTENDANCE_RADIUS_METERS:500,ATTENDANCE_USE_OUTLET_RADIUS:false});
  await assert.rejects(checkIn('stop','sales',-6.002,107),/urutan 1/);
  configs(t,{ATTENDANCE_RADIUS_METERS:500,ATTENDANCE_USE_OUTLET_RADIUS:false,ATTENDANCE_ENFORCE_SEQUENCE:false});
  assert.equal((await checkIn('stop','sales',-6.002,107)).distanceWarning,'OK');
});

test('free ordering still blocks concurrent visits and duplicate check-in', async t => {
  configs(t,{ATTENDANCE_ENFORCE_SEQUENCE:false});
  const {addIn}=attendanceDb(t,{active:true});
  await assert.rejects(checkIn('stop','sales',-6,107),/kunjungan aktif/);
  addIn(); await assert.rejects(checkIn('stop','sales',-6,107),{statusCode:409});
});

test('checkout respects geofence and duration toggles, rejects blank reasons and strict early checkout', async t => {
  configs(t,{}); const {addIn}=attendanceDb(t); addIn();
  await assert.rejects(checkOut('stop','sales',-6.002,107),{statusCode:422});
  await assert.rejects(checkOut('stop','sales',-6,107,null,{earlyReason:'  '}),{statusCode:422});
  assert.equal((await checkOut('stop','sales',-6,107,null,{earlyReason:'Darurat'})).earlyReason,'Darurat');
  configs(t,{ATTENDANCE_ALLOW_EARLY_CHECKOUT:false});
  await assert.rejects(checkOut('stop','sales',-6,107,null,{earlyReason:'Darurat'}),/menunggu durasi/);
  configs(t,{ATTENDANCE_ENFORCE_MIN_DURATION:false,ATTENDANCE_ENFORCE_GEOFENCE:false,ATTENDANCE_ALLOW_EARLY_CHECKOUT:false});
  const record=await checkOut('stop','sales',-6.002,107);
  assert.equal(record.earlyReason,null); assert.equal(record.distanceWarning,'WARNING'); assert.ok(record.durationMinutes>0);
});

test('minimum duration uses exact elapsed time instead of rounded display minutes', async t => {
  configs(t,{}); const {addIn}=attendanceDb(t,{ageMs:299000}); addIn();
  await assert.rejects(checkOut('stop','sales',-6,107),{statusCode:422});
});

test('admin accepts new policy booleans and rejects malformed flags', () => {
  assert.equal(validateConfigMap({CUSTOMER_REG_ENFORCE_PLACES_RADIUS:false,ATTENDANCE_ENFORCE_GEOFENCE:false}).ATTENDANCE_ENFORCE_GEOFENCE,false);
  assert.throws(() => validateConfigMap({ATTENDANCE_ENFORCE_SEQUENCE:'yes'}));
});
