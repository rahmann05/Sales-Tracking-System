import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SERVICE_CATALOG,parseReferenceCatalog,retainServiceCodes,serviceRecordLabel} from '../../shared/reference-catalog.mjs';
import {validateMaintenanceInput} from '../src/modules/vehicles/services/maintenance-input-policy.service.js';
import {CONFIG_PARAMS,parseConfigValue} from '../../shared/config.mjs';
test('catalog validates stable codes, active options and labels without permitting historical code deletion',()=>{
 const rows=[...DEFAULT_SERVICE_CATALOG,{code:'BAN',label:'Ganti ban',active:true}];
 assert.deepEqual(parseReferenceCatalog(JSON.stringify(rows)),rows);
 assert.throws(()=>parseReferenceCatalog([...rows,rows[0]]),/duplikat/);
 assert.throws(()=>parseReferenceCatalog(rows.map(r=>({...r,active:false}))),/Minimal/);
 assert.throws(()=>parseReferenceCatalog(rows.filter(r=>r.code!=='GANTI_OLI')),/tidak boleh dihapus/);
 assert.throws(()=>retainServiceCodes({VEHICLE_SERVICE_CATALOG:DEFAULT_SERVICE_CATALOG},{VEHICLE_SERVICE_CATALOG:rows}),/tidak boleh dihapus/);
 assert.deepEqual(parseConfigValue(CONFIG_PARAMS.find(p=>p.key==='VEHICLE_SERVICE_CATALOG'),rows),rows);
});
test('new service selection follows current policy while historical label comes from its snapshot',()=>{
 const rows=[...DEFAULT_SERVICE_CATALOG.map(r=>({...r,active:r.code!=='GANTI_OLI'})),{code:'BAN',label:'Ganti ban',active:true}];
 assert.ok(validateMaintenanceInput({serviceType:'BAN',odometerAtService:100},{VEHICLE_SERVICE_CATALOG:rows}));
 assert.throws(()=>validateMaintenanceInput({serviceType:'GANTI_OLI',odometerAtService:100},{VEHICLE_SERVICE_CATALOG:rows}),/dinonaktifkan/);
 assert.throws(()=>validateMaintenanceInput({serviceType:'PALSU',odometerAtService:100},{VEHICLE_SERVICE_CATALOG:rows}),/tidak tersedia/);
 assert.equal(serviceRecordLabel({serviceType:'BAN',policySnapshot:{serviceReference:{code:'BAN',label:'Label kejadian'}}}),'Label kejadian');
 assert.equal(serviceRecordLabel({serviceType:'GANTI_OLI'}),'Ganti oli mesin');
});
