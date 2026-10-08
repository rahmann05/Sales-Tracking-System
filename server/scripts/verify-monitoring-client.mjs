import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const client = fileURLToPath(new URL('../../client/', import.meta.url));
const require = createRequire(`${client}/package.json`), esbuild = require('esbuild');
const built = await esbuild.build({ absWorkingDir: client, bundle: true, platform: 'node', format: 'cjs', write: false, stdin: { resolveDir: client, contents: "export {useNotifications} from './src/context/hooks/useNotifications.js'; export {useBackendSync} from './src/context/hooks/useBackendSync.js'; export {useDriverTracking} from './src/context/hooks/useDriverTracking.js';" }, plugins: [{ name: 'hook-fixtures', setup(build) {
  build.onResolve({ filter: /^react$/ }, () => ({ path: 'react', namespace: 'fixture' }));
  build.onResolve({ filter: /services\/api(?:\/notificationsApi)?$/ }, args => ({ path: args.path.includes('notificationsApi') ? 'notifications' : 'api', namespace: 'fixture' }));
  build.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: path === 'react' ? 'export const useState=(...args)=>globalThis.hooks.state(...args),useRef=(...args)=>globalThis.hooks.ref(...args),useEffect=(...args)=>globalThis.hooks.effect(...args);' : path === 'notifications' ? 'export const notificationsApi={getAll:(...args)=>globalThis.api.getAll(...args),read:(...args)=>globalThis.api.read(...args),readAll:(...args)=>globalThis.api.readAll(...args)};' : 'export const getAuthToken=()=>"token",collectPages=(fn,...args)=>fn(...args); export const pjpApi={getTodayPjp:()=>globalThis.api.today(),getAllPjps:()=>globalThis.api.pjps()}, ordersApi={getAllOrders:()=>globalThis.api.orders()},productsApi={},absensiApi={getOffPjpList:()=>globalThis.api.off()},outletsApi={getUnlockRequests:()=>globalThis.api.unlock()},usersApi={getAll:()=>globalThis.api.users()},routeChangesApi={getAll:()=>globalThis.api.routes()},deliveryApi={getDeliveryRoutes:()=>globalThis.api.trips(),reportLocation:(...args)=>globalThis.api.location(...args)};', loader: 'js' }));
} }] });
const mod = { exports: {} }; new Function('require', 'module', 'exports', built.outputFiles[0].text)(require, mod, mod.exports);
const { useNotifications, useBackendSync, useDriverTracking } = mod.exports;
const originalInterval = globalThis.setInterval, originalClear = globalThis.clearInterval;
const timers = new Map(); let timerId = 0;
globalThis.setInterval = fn => { timers.set(++timerId, fn); return timerId; }; globalThis.clearInterval = id => timers.delete(id);
globalThis.window = new EventTarget();
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: true } });
let checks = 0;
const check = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
const settle = async () => { for (let i = 0; i < 15; i++) await new Promise(resolve => setImmediate(resolve)); };
function harness(hook, initial) {
  let args = initial, position = 0, values = [], effects = [], pending = [], result;
  const runtime = {
    state(initial) { const key = position++; if (!(key in values)) values[key] = typeof initial === 'function' ? initial() : initial; return [values[key], value => { values[key] = typeof value === 'function' ? value(values[key]) : value; }]; },
    ref(initial) { const key = position++; return values[key] ||= { current: initial }; },
    effect(callback, deps) { const key = position++, old = effects[key]; if (!old || deps.some((dep, i) => dep !== old.deps[i])) pending.push(() => { old?.cleanup?.(); effects[key] = { deps, cleanup: callback() }; }); },
  };
  return { render(next = args, commit = true) { args = next; position = 0; globalThis.hooks = runtime; result = hook(args); if (commit) { const work = pending; pending = []; work.forEach(fn => fn()); } return result; }, dispose() { effects.forEach(effect => effect?.cleanup?.()); timers.clear(); }, get value() { return result; } };
}
try {
  let stored = [{ id: 'server-1', title: 'Tugas', isRead: false, createdAt: new Date().toISOString() }], fail = false;
  globalThis.api = { getAll: async () => { if (fail) throw new Error('Offline'); return { data: { notifications: stored, unreadCount: stored.filter(n => !n.isRead).length, hasMore: false } }; }, read: async id => { if (fail) throw new Error('Belum tersimpan'); stored = stored.map(n => n.id === id ? { ...n, isRead: true } : n); }, readAll: async () => { stored = stored.map(n => ({ ...n, isRead: true })); } };
  const inbox = harness(useNotifications, { id: 'a', role: 'ADMIN' }); inbox.render(); await settle(); let view = inbox.render();
  check(view.notifications.length, 1); check(view.notificationUnreadCount, 1);
  fail = true; await view.refreshNotifications(); view = inbox.render(); check(view.notifications.length, 1); check(view.notificationStatus.error, 'Offline');
  await view.markNotificationAsRead('server-1'); view = inbox.render(); check(view.notifications[0].read, false);
  fail = false; await view.markNotificationAsRead('server-1'); await settle(); view = inbox.render(); check(view.notifications[0].read, true); check(view.notificationUnreadCount, 0);
  view.addNotification({ title: 'Lokal', roleTarget: ['ADMIN'] }); view = inbox.render(); check(view.notifications.length, 2);
  view.clearNotifications(); view = inbox.render(); check(view.notifications.length, 1);
  let resolveOld; api.getAll = () => new Promise(resolve => { resolveOld = resolve; }); view.refreshNotifications();
  api.getAll = async () => ({ data: { notifications: [], unreadCount: 0, hasMore: false } });
  view = inbox.render({ id: 'b', role: 'ADMIN' }); check(view.notifications.length, 0); await settle();
  resolveOld({ data: { notifications: stored, unreadCount: 0, hasMore: false } }); await settle(); view = inbox.render(); check(view.notifications.length, 0); inbox.dispose();

  let ordersFail = false, routesFail = false, incidentWrites = 0;
  globalThis.api = { today: async () => ({ data: null }), pjps: async () => ({ data: [] }), users: async () => ({ data: [] }), orders: async () => { if (ordersFail) throw new Error('Order unavailable'); return { data: [] }; }, off: async () => ({ data: [] }), unlock: async () => ({ data: [] }), routes: async () => { if (routesFail) throw new Error('Route unavailable'); return { data: [] }; } };
  const noop = () => {};
  const sync = harness(useBackendSync, { user: { id: 'admin', role: 'ADMIN', email: 'admin@example.invalid' }, fetchClusters: async () => [], fetchDivisions: async () => [], setSalesList: noop, setSalesStops: noop, setActiveRoutes: noop, setOffPjpAttendances: noop, setOrders: noop, setProducts: noop, setIncidents: () => incidentWrites++ });
  sync.render(); await settle(); let health = sync.render(); check(Boolean(health.lastSuccessAt), true); const lastSuccess = health.lastSuccessAt; check(incidentWrites, 1);
  ordersFail = true; routesFail = true; window.dispatchEvent(new Event('focus')); await settle(); health = sync.render(); check(health.lastSuccessAt, lastSuccess); check(health.error.includes('Order'), true); check(health.error.includes('Perubahan rute'), true); check(incidentWrites, 1);
  ordersFail = false; routesFail = false; window.dispatchEvent(new Event('online')); await settle(); health = sync.render(); check(health.error, ''); check(incidentWrites, 2); sync.dispose();

  let gps, cleared = false;
  navigator.geolocation = { watchPosition: fn => { gps = fn; return 1; }, clearWatch: () => { cleared = true; } };
  api.trips = async () => ({ data: [{ id: 'trip', code: 'TRIP', status: 'IN_TRANSIT' }] }); api.location = async () => ({ data: { accepted: true } });
  const driver = harness(useDriverTracking, { id: 'driver', role: 'SUPIR' }); driver.render(); await settle(); check(driver.render().status, 'WAITING');
  const observed = Date.now(); await gps({ timestamp: observed, coords: { latitude: -6, longitude: 107, accuracy: 10 } }); check(driver.render().status, 'LIVE');
  const originalNow = Date.now; Date.now = () => observed + 120001;
  try { [...timers.values()][0](); check(driver.render().status, 'STALE'); } finally { Date.now = originalNow; }
  driver.dispose(); check(cleared, true);
  console.log(`Client monitoring verification passed: ${checks} checks including failed reads, recovery, account-switch races, partial sync preservation and GPS expiry.`);
} finally { globalThis.setInterval = originalInterval; globalThis.clearInterval = originalClear; }
