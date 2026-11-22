import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getActiveDatabaseState,
  isLocalDatabaseUrl,
  maskDatabaseUrl,
  resolveDatabaseConfig,
  setActiveDatabaseState,
} from '../src/config/database.js';
import { initDatabaseConnection, prisma } from '../src/config/prisma.js';

const REMOTE_NEON_URL = 'postgresql://neondb_owner:secret@ep-steep-river.aws.neon.tech:5432/neondb';
const LOCAL_PG_URL = 'postgresql://postgres:postgres@localhost:5432/sales_tracking_system';

test('isLocalDatabaseUrl and maskDatabaseUrl identify loopback hosts and strip credentials', () => {
  assert.equal(isLocalDatabaseUrl(LOCAL_PG_URL), true);
  assert.equal(isLocalDatabaseUrl('postgresql://u:p@127.0.0.1:5432/db'), true);
  assert.equal(isLocalDatabaseUrl(REMOTE_NEON_URL), false);
  assert.equal(isLocalDatabaseUrl('not-a-url'), false);

  assert.equal(maskDatabaseUrl(REMOTE_NEON_URL), 'ep-steep-river.aws.neon.tech:5432/neondb');
  assert.equal(maskDatabaseUrl(LOCAL_PG_URL), 'localhost:5432/sales_tracking_system');
  assert.equal(maskDatabaseUrl(''), 'unconfigured');
});

test('resolveDatabaseConfig switches to local Postgres automatically when remote primary is unreachable', async () => {
  let probeCalled = 0;
  const offline = await resolveDatabaseConfig({
    env: {
      DATABASE_URL: REMOTE_NEON_URL,
      LOCAL_DATABASE_URL: LOCAL_PG_URL,
      DB_MODE: 'auto',
    },
    argv: [],
    probe: async (host, port) => {
      probeCalled += 1;
      assert.equal(host, 'ep-steep-river.aws.neon.tech');
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
      DATABASE_URL: REMOTE_NEON_URL,
      LOCAL_DATABASE_URL: LOCAL_PG_URL,
    },
    argv: [],
    probe: async () => true,
  });
  assert.equal(online.mode, 'REMOTE_PRIMARY');
  assert.equal(online.fallbackUsed, false);
  assert.equal(online.url, REMOTE_NEON_URL);
});

test('resolveDatabaseConfig honors explicit --local-db flag, DB_MODE=local, and DB_MODE=remote', async () => {
  let probed = false;
  const probe = async () => {
    probed = true;
    return false;
  };

  const explicitCli = await resolveDatabaseConfig({
    env: { DATABASE_URL: REMOTE_NEON_URL },
    argv: ['node', 'index.js', '--local-db'],
    localEnvFallbackUrl: LOCAL_PG_URL,
    probe,
  });
  assert.equal(probed, false);
  assert.equal(explicitCli.mode, 'LOCAL_EXPLICIT');
  assert.equal(explicitCli.url, LOCAL_PG_URL);

  const explicitEnv = await resolveDatabaseConfig({
    env: { DATABASE_URL: REMOTE_NEON_URL, DB_MODE: 'local', LOCAL_DATABASE_URL: LOCAL_PG_URL },
    argv: [],
    probe,
  });
  assert.equal(explicitEnv.mode, 'LOCAL_EXPLICIT');
  assert.equal(explicitEnv.url, LOCAL_PG_URL);

  const remoteForced = await resolveDatabaseConfig({
    env: { DATABASE_URL: REMOTE_NEON_URL, DB_MODE: 'remote', LOCAL_DATABASE_URL: LOCAL_PG_URL },
    argv: [],
    probe,
  });
  assert.equal(remoteForced.mode, 'REMOTE_PRIMARY');
  assert.equal(remoteForced.url, REMOTE_NEON_URL);
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
      DATABASE_URL: REMOTE_NEON_URL,
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
