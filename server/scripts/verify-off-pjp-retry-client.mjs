import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const client = fileURLToPath(new URL('../../client/', import.meta.url)), require = createRequire(`${client}/package.json`);
const esbuild = require('esbuild');
const built = await esbuild.build({ absWorkingDir: client, bundle: true, platform: 'node', format: 'cjs', write: false, stdin: { resolveDir: client, contents: "export {useOffPjpCheckIn} from './src/pages/Sales/hooks/useOffPjpCheckIn.js';" }, plugins: [{ name: 'off-pjp-fixtures', setup(build) {
  build.onResolve({ filter: /^react$/ }, () => ({ path: 'react', namespace: 'fixture' }));
  build.onResolve({ filter: /context\/AppContext$|\/useGeofence$|\/reverseGeocodeService$/ }, args => ({ path: args.path, namespace: 'fixture' }));
  build.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: path === 'react' ? 'export const useState=(...a)=>globalThis.runtime.state(...a),useRef=(...a)=>globalThis.runtime.ref(...a),useEffect=(...a)=>globalThis.runtime.effect(...a),useCallback=fn=>fn;' : path.includes('AppContext') ? 'export const useApp=()=>({settings:{ATTENDANCE_ALLOW_MANUAL_SALES:true},user:{id:"sales-test"}});' : path.includes('useGeofence') ? 'export const useGeofence=()=>({userLocation:{lat:-6.9,lng:107.6},refreshGpsLocation:()=>{}});' : 'export const getDetailedAddressFromGps=async()=>null;', loader: 'js' }));
} }] });
const mod = { exports: {} }; new Function('require', 'module', 'exports', built.outputFiles[0].text)(require, mod, mod.exports);
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { geolocation: { getCurrentPosition() {} } } });
const storage=new Map();globalThis.sessionStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
const values = [], effects = []; let position = 0, pending = [], checks = 0, failure = true, block, requests = [];
const check = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
globalThis.runtime = {
  state(initial) { const i = position++; if (!(i in values)) values[i] = typeof initial==='function'?initial():initial; return [values[i], next => { values[i] = typeof next === 'function' ? next(values[i]) : next; }]; },
  ref(initial) { const i = position++; return values[i] ||= { current: initial }; },
  effect(callback, deps) { const i = position++, old = effects[i]; if (!old || deps.some((value, index) => value !== old.deps[index])) pending.push(() => { old?.cleanup?.(); effects[i] = { deps, cleanup: callback() }; }); },
};
const onSubmit = async payload => { requests.push(structuredClone(payload)); if (block) await new Promise(resolve => { block = resolve; }); if (failure) throw Object.assign(new Error('Belum terkonfirmasi'), typeof failure === 'number' ? { status: failure } : {}); };
const render = () => { position = 0; const view = mod.exports.useOffPjpCheckIn({ isOpen: true, onSubmit }); const work = pending; pending = []; work.forEach(fn => fn()); return view; };
let view = render(); view.setOutletName('Toko awal'); view.setCustomerName('Pemilik'); view.handleAddressChange('Alamat pengujian'); view.handleCapture('data:image/png;base64,dGVzdA==', { lat: -6.9, lng: 107.6 });
view = render(); await view.handleConfirm(); view = render();
check(view.retryPending, true); check(view.saving, false); check(requests.length, 1); const original = requests[0]; check(Boolean(original.requestId), true);
view.setOutletName('Perubahan yang belum boleh dikirim'); view = render(); failure = false; await view.handleConfirm(); view = render();
check(requests[1], original); check(view.retryPending, false);
await view.handleConfirm(); view = render(); check(requests[2].requestId !== original.requestId, true); check(requests[2].outletName, 'Perubahan yang belum boleh dikirim');
failure = 400; await view.handleConfirm(); view = render(); check(view.retryPending, false); const invalidId = requests.at(-1).requestId;
failure = false; await view.handleConfirm(); view = render(); check(requests.at(-1).requestId !== invalidId, true);
block = true; const before = requests.length, first = view.handleConfirm(); await view.handleConfirm(); check(requests.length, before + 1); check(render().saving, true); block(); block = null; await first; check(render().saving, false);
failure=true;view=render();await view.handleConfirm();const beforeReload=requests.at(-1);effects.forEach(effect=>effect?.cleanup?.());values.length=0;effects.length=0;pending=[];view=render();check(view.retryPending,true);check(view.restored,true);failure=false;await view.handleConfirm();check(requests.at(-1),beforeReload);check(storage.has('form-draft:sales-test:off-pjp'),false);
effects.forEach(effect => effect?.cleanup?.());
console.log(`Off-PJP retry client verification passed: ${checks} checks for frozen payload/identity, retry after uncertain response, validation corrections and rapid double submission.`);
