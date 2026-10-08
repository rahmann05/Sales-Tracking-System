import assert from 'node:assert/strict';
import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
const client=fileURLToPath(new URL('../../client/',import.meta.url)),require=createRequire(new URL('../../client/package.json',import.meta.url)),{build}=require('esbuild');
const result=await build({absWorkingDir:client,bundle:true,platform:'node',format:'cjs',write:false,stdin:{resolveDir:client,contents:"export {GuardedDialog} from './src/shared/components/common/GuardedDialog.jsx';"},plugins:[{name:'guard-harness',setup(build){
 build.onResolve({filter:/^react$|\/NativeDialog$/},args=>({path:args.path,namespace:'fixture'}));
 build.onLoad({filter:/.*/,namespace:'fixture'},({path})=>({contents:path==='react'?"export default {createElement:(type,props,...children)=>({type,props:{...props,children}})};export const useRef=value=>({current:value}),useEffect=fn=>globalThis.cleanups.push(fn()),useState=initial=>[globalThis.confirming,update=>{globalThis.confirming=update}];":"export const NativeDialog='dialog';",loader:'js'}));
}}]});
const mod={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(require,mod,mod.exports);
globalThis.confirming=false;globalThis.window=new EventTarget();globalThis.cleanups=[];let closed=0,confirmed=0,answer=false;window.confirm=()=>{confirmed++;return answer;};
const render=props=>mod.exports.GuardedDialog({open:true,title:'Test',onClose:()=>closed++,...props});
let view=render({dirty:false});view.props.onClose();assert.equal(closed,1);assert.equal(confirmed,0);cleanups.splice(0).forEach(fn=>fn());
view=render({dirty:true});view.props.onClose();assert.equal(closed,1);assert.equal(globalThis.confirming,true);view=render({dirty:true});view.props.onClose();assert.equal(globalThis.confirming,false);let event=new Event('app:before-navigate',{cancelable:true});window.dispatchEvent(event);assert.equal(event.defaultPrevented,true);answer=true;view=render({dirty:true});view.props.onClose();assert.equal(globalThis.confirming,true);view=render({dirty:true});const confirmation=view.props.children[0];confirmation.props.children[2].props.children[1].props.onClick();assert.equal(closed,2);globalThis.confirming=false;cleanups.splice(0).forEach(fn=>fn());
view=render({dirty:true,busy:true});view.props.onClose();assert.equal(closed,2);event=new Event('app:before-navigate',{cancelable:true});window.dispatchEvent(event);assert.equal(event.defaultPrevented,true);event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);assert.equal(event.defaultPrevented,true);cleanups.splice(0).forEach(fn=>fn());
console.log('Dialog guard passed: untouched close, inline dirty cancel/confirm, navigation and unload protection, busy close blocked.');
