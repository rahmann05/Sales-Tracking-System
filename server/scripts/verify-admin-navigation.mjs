import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const client=fileURLToPath(new URL('../../client/',import.meta.url));
const require=createRequire(`${client}/package.json`),esbuild=require('esbuild');
const built=await esbuild.build({absWorkingDir:client,bundle:true,platform:'node',format:'cjs',write:false,stdin:{resolveDir:client,contents:"export {useUnsavedNavigation} from './src/shared/hooks/useUnsavedNavigation.js';"},plugins:[{name:'navigation-hooks',setup(build){
  build.onResolve({filter:/^react$/},()=>({path:'react',namespace:'navigation-fixture'}));
  build.onLoad({filter:/.*/,namespace:'navigation-fixture'},()=>({contents:'export const useRef=initial=>globalThis.navigationHooks.ref(initial),useEffect=callback=>globalThis.navigationHooks.effect(callback);'}));
}}]});
const mod={exports:{}};new Function('require','module','exports',built.outputFiles[0].text)(require,mod,mod.exports);
const originalWindow=globalThis.window;
let state,cleanup,mounted=false,confirmed=false,questions=0;
globalThis.window=new EventTarget();
window.confirm=()=>{questions++;return confirmed;};
globalThis.navigationHooks={ref:initial=>state||=( {current:initial}),effect:callback=>{if(!mounted){mounted=true;cleanup=callback();}}};
const render=(dirty,busy=false)=>mod.exports.useUnsavedNavigation(dirty,busy);
const leave=()=>window.dispatchEvent(new Event('app:before-navigate',{cancelable:true}));
try {
  render(false);assert.equal(leave(),true);assert.equal(questions,0);
  // Re-rendering must protect edits immediately, before an effect re-runs.
  render(true);assert.equal(leave(),false);assert.equal(questions,1);
  confirmed=true;assert.equal(leave(),true);assert.equal(questions,2);
  render(true,true);assert.equal(leave(),false);assert.equal(questions,2,'Saving blocks navigation without asking to discard');
  const unload=new Event('beforeunload',{cancelable:true});window.dispatchEvent(unload);assert.equal(unload.defaultPrevented,true);
  render(false);assert.equal(leave(),true);assert.equal(questions,2,'Saved forms do not ask again');
  render(true);cleanup();assert.equal(leave(),true);assert.equal(questions,2,'Unmount removes guards');
  console.log('Admin navigation guard passed: immediate edit protection, cancel/confirm, busy save, unload, clean form and cleanup.');
} finally {
  cleanup?.();globalThis.window=originalWindow;delete globalThis.navigationHooks;
}
