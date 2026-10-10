import test from 'node:test';
import assert from 'node:assert/strict';
import {parseReasonOptions,earlyReasonError,DEFAULT_EARLY_REASONS} from '../../shared/visit-reasons.mjs';
import {CONFIG_PARAMS,parseConfigValue} from '../../shared/config.mjs';
test('Visit reasons validate references and preserve custom compatibility',()=>{
 assert.equal(parseReasonOptions(DEFAULT_EARLY_REASONS).length,5);
 assert.deepEqual(parseReasonOptions(' Satu \r\n\nDua '),['Satu','Dua']);
 for(const invalid of ['',null,'Satu\nsatu','x'.repeat(201),Array.from({length:31},(_,i)=>String(i)).join('\n')])assert.throws(()=>parseReasonOptions(invalid));
 const values={ATTENDANCE_EARLY_REASON_OPTIONS:'Satu\nDua',ATTENDANCE_EARLY_ALLOW_CUSTOM_REASON:false};
 assert.equal(earlyReasonError(' Satu ',values),null);
 assert.ok(earlyReasonError('Tiga',values));
 assert.equal(earlyReasonError('Tiga',{...values,ATTENDANCE_EARLY_ALLOW_CUSTOM_REASON:true}),null);
 assert.equal(earlyReasonError('Alasan lama',{}),null);
 assert.ok(earlyReasonError(' ',values));
 assert.ok(earlyReasonError('x'.repeat(1001),{}));
 assert.equal(parseConfigValue(CONFIG_PARAMS.find(p=>p.key==='ATTENDANCE_EARLY_REASON_OPTIONS'),' Satu \r\nDua '),'Satu\nDua');
});
