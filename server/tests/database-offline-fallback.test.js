import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyPoolerDefaults,
  getActiveDatabaseState,
  isLocalDatabaseUrl,
  maskDatabaseUrl,
  resolveDatabaseConfig,
  setActiveDatabaseState,
} from '../src/config/database.js';
import {
  initDatabaseConnection,
  prisma,
  prismaTransactionOptions,
} from '../src/config/prisma.js';

const REMOTE_DB_URL = 'postgresql://postgres.demo:secret@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres';
const LOCAL_PG_URL = 'postgresql://postgres:postgres@localhost:5432/sales_tracking_system';

test('applyPoolerDefaults adds PgBouncer pool tuning without overriding explicit params or local URLs', () => {
  assert.equal(applyPoolerDefaults(LOCAL_PG_URL), LOCAL_PG_URL);

  const pooled = applyPoolerDefaults(
    'postgresql://postgres.demo:secret@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true'
  );
  const parsed = new URL(pooled);
  assert.equal(parsed.searchParams.get('connection_limit'), '15');
  assert.equal(parsed.searchParams.get('pool_timeout'), '20');

  const explicit = applyPoolerDefaults(
    'postgresql://postgres.demo:secret@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=8&pool_timeout=30'
  );
  const parsedExplicit = new URL(explicit);
  assert.equal(parsedExplicit.searchParams.get('connection_limit'), '8');
  assert.equal(parsedExplicit.searchParams.get('pool_timeout'), '30');
});

test('isLocalDatabaseUrl and maskDatabaseUrl identify loopback hosts and strip credentials', () => {
  assert.equal(isLocalDatabaseUrl(LOCAL_PG_URL), true);
  assert.equal(isLocalDatabaseUrl('postgresql://u:p@127.0.0.1:5432/db'), true);
  assert.equal(isLocalDatabaseUrl(REMOTE_DB_URL), false);
  assert.equal(isLocalDatabaseUrl('not-a-url'), false);

  assert.equal(maskDatabaseUrl(REMOTE_DB_URL), 'aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres');
  assert.equal(maskDatabaseUrl(LOCAL_PG_URL), 'localhost:5432/sales_tracking_system');
  assert.equal(maskDatabaseUrl(''), 'unconfigured');
});

test('resolveDatabaseConfig switches to local Postgres automatically when remote primary is unreachable', async () => {
  let probeCalled = 0;
  const offline = await resolveDatabaseConfig({
    env: {
      DATABASE_URL: REMOTE_DB_URL,
      LOCAL_DATABASE_URL: LOCAL_PG_URL,
      DB_MODE: 'auto',
    },
    argv: [],
    probe: async (host, port) => {
      probeCalled += 1;
      assert.equal(host, 'aws-1-ap-southeast-2.pooler.supabase.com');
      assert.equal(port, 5432);
      return false;
    },
  });
  assert.equal(probeCalled, 1);
  assert.equal(offline.mode, 'LOCAL_FALLBACK');
  assert.equal(offline.fallbackUsed, true);
  assert.equal(offline.url, LOCAL_PG_URL);
  assert.equal(offline.target, 'localhost:5432/sales_tracking_system');

  const online = await resolveDatabaseConfig({
    env: {
      DATABASE_URL: REMOTE_DB_URL,
      LOCAL_DATABASE_URL: LOCAL_PG_URL,
    },
    argv: [],
    probe: async () => true,
  });
  assert.equal(online.mode, 'REMOTE_PRIMARY');
  assert.equal(online.fallbackUsed, false);
  assert.equal(online.url, REMOTE_DB_URL);
});

test('resolveDatabaseConfig honors explicit --local-db flag, DB_MODE=local, and DB_MODE=remote', async () => {
  let probed = false;
  const probe = async () => {
    probed = true;
    return false;
  };

  const explicitCli = await resolveDatabaseConfig({
    env: { DATABASE_URL: REMOTE_DB_URL },
    argv: ['node', 'index.js', '--local-db'],
    localEnvFallbackUrl: LOCAL_PG_URL,
    probe,
  });
  assert.equal(probed, false);
  assert.equal(explicitCli.mode, 'LOCAL_EXPLICIT');
  assert.equal(explicitCli.url, LOCAL_PG_URL);

  const explicitEnv = await resolveDatabaseConfig({
    env: { DATABASE_URL: REMOTE_DB_URL, DB_MODE: 'local', LOCAL_DATABASE_URL: LOCAL_PG_URL },
    argv: [],
    probe,
  });
  assert.equal(explicitEnv.mode, 'LOCAL_EXPLICIT');
  assert.equal(explicitEnv.url, LOCAL_PG_URL);

  const remoteForced = await resolveDatabaseConfig({
    env: { DATABASE_URL: REMOTE_DB_URL, DB_MODE: 'remote', LOCAL_DATABASE_URL: LOCAL_PG_URL },
    argv: [],
    probe,
  });
  assert.equal(remoteForced.mode, 'REMOTE_PRIMARY');
  assert.equal(remoteForced.url, REMOTE_DB_URL);
});

test('initDatabaseConnection updates active database state and process.env.DATABASE_URL cleanly', async (t) => {
  const prevDbUrl = process.env.DATABASE_URL;
  const prevDirectUrl = process.env.DIRECT_URL;
  const prevState = getActiveDatabaseState();

  t.after(async () => {
    if (prevDbUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevDbUrl;
    if (prevDirectUrl === undefined) delete process.env.DIRECT_URL;
    else process.env.DIRECT_URL = prevDirectUrl;
    setActiveDatabaseState(prevState);
    await prisma.$disconnect().catch(() => {});
  });

  const selection = await initDatabaseConnection({
    env: {
      DATABASE_URL: REMOTE_DB_URL,
      LOCAL_DATABASE_URL: LOCAL_PG_URL,
      DB_MODE: 'auto',
    },
    argv: [],
    probe: async () => false,
  });

  assert.equal(selection.mode, 'LOCAL_FALLBACK');
  assert.equal(process.env.DATABASE_URL, LOCAL_PG_URL);
  assert.equal(getActiveDatabaseState().mode, 'LOCAL_FALLBACK');
  assert.equal(getActiveDatabaseState().fallbackUsed, true);
});

test('prismaTransactionOptions raises global transaction ceiling and honors overrides', () => {
  assert.deepEqual(prismaTransactionOptions({}), { maxWait: 15000, timeout: 30000 });
  assert.deepEqual(
    prismaTransactionOptions({ PRISMA_TX_MAX_WAIT_MS: '20000', PRISMA_TX_TIMEOUT_MS: '45000' }),
    { maxWait: 20000, timeout: 45000 }
  );
});
