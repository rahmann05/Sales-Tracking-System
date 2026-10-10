import test from 'node:test';
import assert from 'node:assert/strict';
import {evidenceImageError,evidenceImageFormats} from '../../shared/evidence-image-policy.mjs';
import {CONFIG_DEFAULTS,CONFIG_PARAMS,parseConfigValue} from '../../shared/config.mjs';
import {policyConflicts,DRIVER_EVIDENCE_KEYS} from '../../shared/operational-policy.mjs';
import {assertEvidenceImages} from '../src/utils/evidence-images.js';
import {withPolicy} from '../src/modules/config/services/policy-context.service.js';

const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=';
const image=(bytes,type='png')=>`data:image/${type};base64,${Buffer.from(bytes).toString('base64')}`;
test('New image evidence checks byte limits, MIME signatures and canonical base64',()=>{
 assert.equal(evidenceImageError(png),null);
 assert.equal(evidenceImageError(image([255,216,255,217],'jpeg')),null);
 assert.equal(evidenceImageError(image(Buffer.from('RIFF1234WEBP1234'),'webp')),null);
 for(const value of ['data:image/png;base64,YWJj',png.replace('image/png','image/jpeg'),png.slice(0,-1),png+'=',png.slice(0,-4)+'A===',png.slice(0,-4)+'AB==','data:image/svg+xml;base64,PHN2Zz4=',{},'javascript:alert(1)'])assert.ok(evidenceImageError(value),String(value));
 const bytes=Buffer.alloc(50*1024);Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);
 assert.equal(evidenceImageError(image(bytes),{EVIDENCE_IMAGE_MAX_KB:50}),null);
 assert.match(evidenceImageError(image(Buffer.concat([bytes,Buffer.from([0])])),{EVIDENCE_IMAGE_MAX_KB:50}),/maksimal 50 KB/);
 assert.match(evidenceImageError(png,{EVIDENCE_IMAGE_FORMATS:'JPEG'}),/format diizinkan JPEG/);
 assert.equal(evidenceImageError(null),null);
});
test('External image references are explicit; accepting a URL does not inspect its content',()=>{
 assert.equal(evidenceImageError('https://example.invalid/photo.png'),null);
 assert.match(evidenceImageError('https://example.invalid/photo.png',{EVIDENCE_ALLOW_REMOTE_IMAGES:false}),/eksternal tidak diizinkan/);
 for(const value of ['ftp://example.invalid/a','https://user:secret@example.invalid/a','/photo.png','https://example.invalid/'+ 'a'.repeat(2048)])assert.ok(evidenceImageError(value));
});
test('Format settings reject unknown/duplicate entries and impossible required visit attachments',()=>{
 assert.deepEqual(evidenceImageFormats('PNG, JPEG'),['PNG','JPEG']);
 const param=CONFIG_PARAMS.find(p=>p.key==='EVIDENCE_IMAGE_FORMATS');
 assert.equal(parseConfigValue(param,' PNG, JPEG '),'PNG,JPEG');
 for(const value of ['',null,'png','JPEG,JPEG','PNG,','SVG'])assert.throws(()=>parseConfigValue(param,value));
 assert.ok(policyConflicts({...CONFIG_DEFAULTS,EVIDENCE_IMAGE_FORMATS:'WEBP',VISIT_RESULT_ATTACHMENT_MODE:'REQUIRED'}).some(v=>v.includes('JPEG atau PNG')));
 assert.deepEqual(policyConflicts({...CONFIG_DEFAULTS,EVIDENCE_IMAGE_FORMATS:'WEBP',VISIT_RESULT_ATTACHMENT_MODE:'OPTIONAL'}),[]);
 for(const key of ['EVIDENCE_IMAGE_MAX_KB','EVIDENCE_IMAGE_FORMATS','EVIDENCE_ALLOW_REMOTE_IMAGES'])assert.ok(DRIVER_EVIDENCE_KEYS.includes(key));
});
test('Server rejects nested new evidence, honors frozen settings and compatibility defaults',async()=>{
 const live={values:{...CONFIG_DEFAULTS,EVIDENCE_IMAGE_FORMATS:'JPEG',EVIDENCE_ALLOW_REMOTE_IMAGES:false}};
 await withPolicy(live,async()=>{
  await assert.rejects(()=>assertEvidenceImages({attachments:[{dataUrl:png}]}),e=>e.statusCode===422&&e.message.includes('format diizinkan'));
  await assert.rejects(()=>assertEvidenceImages({taxDocumentUrl:'https://example.invalid/a'}),e=>e.statusCode===422);
  await assertEvidenceImages({photoUrl:png},{entity:{policySnapshot:{values:{EVIDENCE_IMAGE_FORMATS:'PNG'}}}});
  await assertEvidenceImages({photoUrl:png},{entity:{policySnapshot:{values:{}}}});
  await assertEvidenceImages({photoUrl:'https://example.invalid/a'},{entity:{policySnapshot:{values:{}}}});
 });
 await assert.rejects(()=>assertEvidenceImages({photos:[{photoUrl:'data:image/jpeg;base64,YWJj'}]},{values:{}}),e=>e.statusCode===422&&e.message.includes('Bukti.photos.0.photoUrl'));
});
