import test from 'node:test';
import assert from 'node:assert/strict';
import {requiredRegistrationFields,registrationFieldError} from '../../shared/registration-fields.mjs';
import {CONFIG_PARAMS,parseConfigValue} from '../../shared/config.mjs';
test('Per-stage requirements accept only known fields and distinguish empty values',()=>{
 assert.deepEqual(requiredRegistrationFields(''),[]);
 assert.deepEqual(requiredRegistrationFields('phone, ownerName'),['phone','ownerName']);
 for(const invalid of ['phone,phone','latitude','deletedAt',null])assert.throws(()=>requiredRegistrationFields(invalid));
 assert.equal(registrationFieldError({phone:'0812',ownerName:'Usman'},'phone,ownerName'),null);
 assert.match(registrationFieldError({phone:' '},'phone,ownerName','aktivasi'),/aktivasi.*Nomor telepon.*Pemilik/);
 assert.equal(parseConfigValue(CONFIG_PARAMS.find(p=>p.key==='REGISTRATION_ACTIVATION_REQUIRED_FIELDS'),'phone, ownerName'),'phone,ownerName');
});
