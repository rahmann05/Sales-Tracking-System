import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {cameraInputPolicy,imageFileError} from '../../shared/camera-input-policy.mjs';
import {processPolicyValues} from '../../shared/process-policy.mjs';
test('Camera choices retain legacy behavior and frozen process settings',()=>{
 assert.deepEqual(cameraInputPolicy(),{mode:'CAMERA',live:true,native:true,upload:false});
 assert.equal(cameraInputPolicy('LIVE_CAMERA').native,false);
 assert.equal(cameraInputPolicy('NATIVE_CAMERA').live,false);
 assert.equal(cameraInputPolicy('CAMERA_OR_UPLOAD').upload,true);
 assert.equal(cameraInputPolicy('unknown').mode,'CAMERA');
 assert.equal(processPolicyValues({values:{}},{CAMERA_INPUT_MODE:'CAMERA_OR_UPLOAD'}).CAMERA_INPUT_MODE,'CAMERA');
 assert.equal(processPolicyValues({values:{CAMERA_INPUT_MODE:'LIVE_CAMERA'}},{CAMERA_INPUT_MODE:'CAMERA_OR_UPLOAD'}).CAMERA_INPUT_MODE,'LIVE_CAMERA');
});
test('Invalid image files never reach FileReader',async()=>{
 let reads=0;
 const source=await readFile(new URL('../../client/src/services/nativeFileCaptureService.js',import.meta.url),'utf8');
 const context={imageFileError,FileReader:class{readAsDataURL(){reads++;this.result='data:image/jpeg;base64,YQ==';this.onloadend();}}};
 vm.runInNewContext(source.replace(/import .*?;\n/,'').replace('export const nativeFileCaptureService','globalThis.service'),context);
 assert.equal(await context.service.readFileAsDataUrl(null),null);
 for(const file of [{type:'image/svg+xml',size:10},{type:'text/html',size:10},{type:'image/png',size:0},{type:'image/jpeg',size:12*1024*1024+1}])await assert.rejects(()=>context.service.readFileAsDataUrl(file));
 assert.equal(reads,0);
 assert.equal(await context.service.readFileAsDataUrl({type:'image/jpeg',size:100}),'data:image/jpeg;base64,YQ==');
 assert.equal(reads,1);
});
