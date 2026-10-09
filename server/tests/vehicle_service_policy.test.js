import {test} from 'node:test';
import assert from 'node:assert/strict';
import {vehicleServiceStatus} from '../../shared/vehicle-service-policy.mjs';
import {validateMaintenanceInput} from '../src/modules/vehicles/services/maintenance-input-policy.service.js';
import {maintenancePolicySchema} from '../src/modules/vehicles/services/maintenance-policy.service.js';
import {recordMaintenanceSchema} from '../src/modules/vehicles/vehicles.schema.js';
const vehicle={totalKm:9000,lastOilChangeKm:5000,lastOilFilterChangeKm:0,lastBrakePadChangeKm:0};
test('service warning follows effective thresholds and custom vehicle rules without rewriting mileage',()=>{
 const before=structuredClone(vehicle);
 assert.equal(vehicleServiceStatus(vehicle)[0].state,'DUE_SOON');
 assert.equal(vehicleServiceStatus(vehicle,{VEHICLE_SERVICE_WARNING_PERCENT:90})[0].state,'OK');
 const special={...vehicle,maintenancePolicy:{intervals:{GANTI_OLI:3000}}};
 assert.equal(vehicleServiceStatus(special)[0].state,'OVERDUE');
 assert.equal(vehicleServiceStatus(special)[0].source,'VEHICLE');
 assert.equal(vehicleServiceStatus(special)[1].source,'PROFILE');
 assert.deepEqual(vehicle,before);
});
test('disabled reminders do not erase service distances and unknown mileage is never represented as healthy',()=>{
 assert.equal(vehicleServiceStatus({...vehicle,maintenancePolicy:{reminderMode:'OFF'}})[0].state,'DISABLED');
 assert.equal(vehicleServiceStatus(vehicle,{VEHICLE_SERVICE_REMINDERS_ENABLED:false})[0].remaining,1000);
 assert.equal(vehicleServiceStatus({...vehicle,maintenancePolicy:{reminderMode:'ON'}},{VEHICLE_SERVICE_REMINDERS_ENABLED:false})[0].enabled,true);
 assert.equal(vehicleServiceStatus({...vehicle,totalKm:null})[0].state,'UNKNOWN');
});
const now=Date.parse('2026-10-09T00:30:00+07:00'),input={serviceType:'GANTI_OLI',odometerAtService:1000.5};
test('service date uses WIB calendar boundaries, including midnight and maximum backdate',()=>{
 const disabled={VEHICLE_SERVICE_ALLOW_BACKDATE:false};
 assert.equal(+validateMaintenanceInput({...input,serviceDate:'2026-10-08T17:00:00Z'},disabled,now),Date.parse('2026-10-09T00:00:00+07:00'));
 assert.throws(()=>validateMaintenanceInput({...input,serviceDate:'2026-10-08T16:59:59Z'},disabled,now),e=>e.statusCode===422);
 validateMaintenanceInput({...input,serviceDate:'2026-10-07T00:00:00+07:00'},{VEHICLE_SERVICE_MAX_BACKDATE_DAYS:2},now);
 assert.throws(()=>validateMaintenanceInput({...input,serviceDate:'2026-10-06T23:59:59+07:00'},{VEHICLE_SERVICE_MAX_BACKDATE_DAYS:2},now),e=>e.statusCode===422);
 assert.throws(()=>validateMaintenanceInput({...input,serviceDate:'2026-10-10T00:00:00+07:00'},{},now),e=>e.statusCode===400);
});
test('workshop and note obligations are independent and actual odometers must be finite',()=>{
 validateMaintenanceInput(input,{},now);
 for(const [rule,field] of [['VEHICLE_SERVICE_REQUIRE_WORKSHOP','workshopName'],['VEHICLE_SERVICE_REQUIRE_NOTE','notes']]){
  assert.throws(()=>validateMaintenanceInput({...input,[field]:'   '},{[rule]:true},now),e=>e.statusCode===422);
  validateMaintenanceInput({...input,[field]:'Bukti aktual'},{[rule]:true},now);
 }
 for(const value of [NaN,Infinity,-1])assert.throws(()=>validateMaintenanceInput({...input,odometerAtService:value},{},now),e=>e.statusCode===400);
 assert.equal(recordMaintenanceSchema.safeParse({body:{...input,cost:Infinity},params:{id:'00000000-0000-4000-8000-000000000001'}}).success,false);
});
test('vehicle overrides require a complete bounded policy, revision timestamp and meaningful reason',()=>{
 const valid={updatedAt:new Date(now).toISOString(),reason:'Interval sesuai buku kendaraan',reminderMode:'INHERIT',intervals:{GANTI_OLI:null,GANTI_FILTER_OLI:10000,GANTI_KANVAS_REM:20000}};
 assert.equal(maintenancePolicySchema.safeParse(valid).success,true);
 for(const bad of [{...valid,reason:'  '},{...valid,intervals:{...valid.intervals,GANTI_OLI:99}},{...valid,intervals:{...valid.intervals,GANTI_OLI:500.5}},{...valid,intervals:{...valid.intervals,STOCK:1}}])assert.equal(maintenancePolicySchema.safeParse(bad).success,false);
});
