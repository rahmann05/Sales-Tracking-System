import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseAuditItems,auditAnswers,auditFailed} from '../../shared/supervision-checklist.mjs';
import {staffActionSchema} from '../src/modules/staff-attendance/staff-attendance.schema.js';

const questions=()=>parseAuditItems([
 {key:'display',label:'Display sesuai',required:true,requireFailureReason:true,requireFailurePhoto:true},
 {key:'temperature',label:'Suhu terukur',type:'NUMBER',required:true,min:-40,max:30,failureBelow:-20,requireFailureReason:true},
 {key:'condition',label:'Kondisi outlet',type:'SELECT',required:true,options:['Baik','Perlu perbaikan'],failedValues:['Perlu perbaikan'],requireFailureReason:true},
 {key:'notes',label:'Catatan tambahan',type:'TEXT',required:false},
]);
const photo='data:image/jpeg;base64,/9j/2Q==';
test('typed audit: false and zero are answers; failed evidence required without inventing proof',()=>{
 const items=questions(),answers={display:false,temperature:0,condition:'Baik'};
 assert.throws(()=>auditAnswers(items,answers),/Alasan/);
 assert.throws(()=>auditAnswers(items,answers,{display:{reason:'Pajangan perlu dirapikan'}}),/Foto/);
 assert.deepEqual(auditAnswers(items,answers,{display:{reason:'  Pajangan perlu dirapikan  ',photoUrl:photo}}),{...answers,_evidence:{display:{reason:'Pajangan perlu dirapikan',photoUrl:photo}}});
 assert.equal(auditFailed(items[1],-20),false);assert.equal(auditFailed(items[1],-21),true);
 assert.throws(()=>auditAnswers(items,{...answers,display:true,temperature:-21}),/Alasan/);
 assert.throws(()=>auditAnswers(items,{...answers,display:true,condition:'Perlu perbaikan'}),/Alasan/);
});
test('typed audit rejects wrong types, range, unsupported choice and unsafe attachments',()=>{
 const items=questions(),answers={display:true,temperature:0,condition:'Baik'};
 for(const patch of [{display:'false'},{temperature:NaN},{temperature:-41},{temperature:'0'},{condition:'Tidak dikenal'},{notes:400}])assert.throws(()=>auditAnswers(items,{...answers,...patch}),/tidak valid/);
 assert.throws(()=>auditAnswers(items,answers,{display:{photoUrl:'javascript:alert(1)'}}),/Foto/);
 assert.throws(()=>auditAnswers(items,answers,{display:{photoUrl:'data:image/svg+xml;base64,PHN2Zz4='}}),/Foto/);
 assert.throws(()=>auditAnswers(items,answers,{display:{photoUrl:'data:image/jpeg;base64,'+'A'.repeat(2800000)}}),/Foto/);
 assert.deepEqual(auditAnswers(items,{...answers,notes:'  Catatan lapangan  ',state:'FINISHED'}),{...answers,notes:'Catatan lapangan'});
});
test('audit definitions reject ambiguous failure conditions and mismatched metadata',()=>{
 const base={key:'question',label:'Pertanyaan uji',required:true};
 for(const patch of [{type:'RATING'},{type:'SELECT',options:['A','A']},{type:'SELECT',options:['A','B'],failedValues:['C']},{type:'SELECT',options:['A','B'],requireFailurePhoto:true},{type:'NUMBER',min:10,max:0},{type:'NUMBER',requireFailureReason:true},{type:'NUMBER',min:0,max:10,failureBelow:11},{type:'TEXT',requireFailureReason:true},{type:'BOOLEAN',min:0}])assert.throws(()=>parseAuditItems([{...base,...patch}]));
 const parsed=staffActionSchema.parse({body:{action:'AUDIT',stopId:'x',checklist:{display:false,temperature:0,condition:'Baik',notes:null},auditEvidence:{display:{reason:'Alasan temuan',photoUrl:photo}}}});
 assert.equal(parsed.body.checklist.temperature,0);
 assert.throws(()=>staffActionSchema.parse({body:{action:'AUDIT',checklist:{state:{finished:true}}}}));
});
