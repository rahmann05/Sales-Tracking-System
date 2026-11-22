import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../client/package.json', import.meta.url));
const esbuild = require('esbuild');

const mocks = {
  react: `
    export const useState = (value) => globalThis.countHarness.state(value);
    export const useRef = (value) => globalThis.countHarness.ref(value);
    export const useCallback = (fn, deps) => globalThis.countHarness.memo(() => fn, deps);
    export const useEffect = (fn, deps) => globalThis.countHarness.effect(fn, deps);
  `,
  api: `
    export const clustersApi = globalThis.countApi;
    export const outletsApi = { getAll: async () => ({ data: [] }) };
    export const collectPages = async (fn, q) => fn(q);
    export const teamsApi = { getAll: async () => ({ data: { sales: [], supervisors: [] } }) };
  `,
  appContext: `
    export const useApp = () => ({ user: { id: 'admin', role: 'ADMIN' }, settings: {} });
  `,
  unsavedNav: `
    export const useUnsavedNavigation = () => {};
  `,
};

const bundle = await esbuild.build({
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  absWorkingDir: fileURLToPath(new URL('../../client/', import.meta.url)),
  entryPoints: ['src/pages/RoutePlanning/hooks/useClusterBuilder.js'],
  plugins: [
    {
      name: 'count-fixture',
      setup(build) {
        build.onResolve(
          { filter: /^(react|.*\/services\/api|.*\/context\/AppContext|.*\/hooks\/useUnsavedNavigation)$/ },
          (args) => {
            if (args.path === 'react') return { path: 'react', namespace: 'fixture' };
            if (args.path.endsWith('/services/api')) return { path: 'api', namespace: 'fixture' };
            if (args.path.endsWith('/context/AppContext')) {
              return { path: 'appContext', namespace: 'fixture' };
            }
            return { path: 'unsavedNav', namespace: 'fixture' };
          }
        );
        build.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
          contents: mocks[args.path],
          loader: 'js',
        }));
      },
    },
  ],
});

const createMemoryStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
};

const prevSession = globalThis.sessionStorage;
const prevLocal = globalThis.localStorage;
globalThis.sessionStorage = createMemoryStorage();
globalThis.localStorage = createMemoryStorage();

const slots = [];
const timers = new Map();
const calls = [];
let cursor = 0;
let pending = [];
let dirty = false;
let builder;
let timerId = 0;
let now = 0;
let deferredNearest = null;

const equal = (a, b) =>
  a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));

globalThis.countHarness = {
  state(initial) {
    const index = cursor++;
    if (!slots[index]) {
      slots[index] = {
        value: typeof initial === 'function' ? initial() : initial,
      };
    }
    return [
      slots[index].value,
      (value) => {
        const next = typeof value === 'function' ? value(slots[index].value) : value;
        if (!Object.is(next, slots[index].value)) {
          slots[index].value = next;
          dirty = true;
        }
      },
    ];
  },
  ref(value) {
    const index = cursor++;
    if (!slots[index]) slots[index] = { current: value };
    return slots[index];
  },
  memo(fn, deps) {
    const index = cursor++;
    if (!equal(slots[index]?.deps, deps)) slots[index] = { deps, value: fn() };
    return slots[index].value;
  },
  effect(fn, deps) {
    const index = cursor++;
    if (!equal(slots[index]?.deps, deps)) {
      const previous = slots[index];
      slots[index] = { deps, cleanup: previous?.cleanup };
      pending.push(() => {
        previous?.cleanup?.();
        slots[index].cleanup = fn();
      });
    }
  },
};

const outlets = (count) =>
  Array.from({ length: count }, (_, index) => ({
    id: `outlet-${index}`,
    type: 'GENERAL_TRADE',
    cluster: { name: 'Belum Ditugaskan' },
  }));

globalThis.countApi = {
  teamOptions: async () => ({ data: { sales: [], supervisors: [] } }),
  getNearestOutlets: async (lat, lng, count, type, supervisorId) => {
    calls.push({ lat, lng, count, type, supervisorId });
    if (deferredNearest) return deferredNearest.promise;
    return { data: outlets(count) };
  },
  generateRoutes: async (ids) => ({ data: [{ outletIds: ids }] }),
};

const mod = { exports: {} };
new Function('module', 'exports', 'setTimeout', 'clearTimeout', bundle.outputFiles[0].text)(
  mod,
  mod.exports,
  (fn, delay) => {
    const id = ++timerId;
    timers.set(id, { fn, at: now + delay });
    return id;
  },
  (id) => timers.delete(id)
);

const render = () => {
  let passes = 0;
  do {
    assert.ok(++passes < 12, 'Hook did not settle');
    dirty = false;
    cursor = 0;
    pending = [];
    builder = mod.exports.useClusterBuilder({
      user: { id: 'admin', role: 'ADMIN' },
      onSaved: () => {},
    });
    pending.forEach((run) => run());
  } while (dirty);
};

const flush = async () => {
  for (let index = 0; index < 12; index++) {
    await Promise.resolve();
    if (dirty) render();
  }
};

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

try {
  render();
  await flush();

  // 1. Typing / suggesting before setting centerPoint must not fetch
  builder.setOutletCount(6);
  render();
  await builder.suggest();
  render();
  assert.equal(calls.length, 0, 'Suggesting before choosing a center must not fetch');

  // 2. selectCenter stores centerPoint without auto-fetching, then suggest() fetches count=6
  const center = { lat: -6.9, lng: 107.6 };
  builder.selectCenter(center);
  render();
  assert.deepEqual(builder.centerPoint, center);
  assert.equal(calls.length, 0, 'selectCenter must not auto-fetch nearest outlets');

  await builder.suggest();
  render();
  assert.equal(calls.length, 1);
  assert.equal(calls.at(-1).count, 6);
  assert.equal(builder.suggestions.length, 6);
  assert.equal(builder.busy, false);

  // 3. Invalid integer bounds (0, 101, 1.5) fail locally without calling API
  const beforeInvalid = calls.length;
  for (const count of [0, 101, 1.5]) {
    builder.setOutletCount(count);
    render();
    await builder.suggest();
    render();
    assert.equal(builder.busy, false);
    assert.match(builder.error, /1–100/);
  }
  assert.equal(calls.length, beforeInvalid);

  // 4. Single-flight lock prevents duplicate concurrent suggest() calls
  builder.setOutletCount(4);
  render();
  deferredNearest = deferred();
  const pendingNearest = deferredNearest;
  const p1 = builder.suggest();
  render();
  assert.equal(builder.busy, true);
  assert.equal(calls.length, beforeInvalid + 1);
  const p2 = builder.suggest();
  assert.equal(calls.length, beforeInvalid + 1, 'Concurrent suggest must be ignored while in flight');
  deferredNearest = null;
  pendingNearest.resolve({ data: outlets(4) });
  await Promise.all([p1, p2]);
  await flush();
  assert.equal(builder.busy, false);
  assert.equal(builder.suggestions.length, 4);

  // Restore 6 suggestions, apply to selectedOutlets, and generate route
  builder.setOutletCount(6);
  render();
  await builder.suggest();
  render();
  builder.applySuggestions();
  render();
  assert.equal(builder.selectedOutlets.length, 6);
  assert.equal(builder.suggestions.length, 0);

  await builder.generate();
  render();
  assert.equal(builder.routes.length, 1);
  assert.equal(builder.routes[0].outletIds.length, 6);

  // 6. Changing tradeType is blocked while outlets are selected
  builder.field('tradeType', 'MODERN_TRADE');
  render();
  assert.match(builder.error, /Lepaskan pilihan outlet/);
  assert.equal(builder.draft.tradeType, 'GENERAL_TRADE');

  // 7. Unmount cleanup runs cleanly
  slots.forEach((slot) => slot.cleanup?.());
  console.log(
    'Cluster count regression passed: center gate, suggest validation, single-flight lock, applySuggestions, generate, trade lock and unmount cleanup.'
  );
} finally {
  delete globalThis.countHarness;
  delete globalThis.countApi;
  if (prevSession === undefined) delete globalThis.sessionStorage;
  else globalThis.sessionStorage = prevSession;
  if (prevLocal === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = prevLocal;
}
