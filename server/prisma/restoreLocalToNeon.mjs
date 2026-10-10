// Operator tool. Default is read-only; replacement requires a tested archive,
// a separate Neon backup branch, and an explicit archive digest.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify, isDeepStrictEqual} from 'node:util';
import dotenv from 'dotenv';
import pg from 'pg';

const exec = promisify(execFile);
const server = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.dirname(server);
const args = process.argv.slice(2);
const option = (name, fallback) => args.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const stage = option('stage', 'inspect');
if (!['inspect', 'prepare', 'test', 'apply', 'verify'].includes(stage)) throw Error('Unknown stage');
const directory = path.join(root, '.backups', 'neon-sync-20261010');
const archive = path.join(directory, 'local-public.dump');
const pgBin = option('pg-bin', 'C:/Program Files/PostgreSQL/18/bin');
const context = JSON.parse(fs.readFileSync(path.join(root, '.neon'), 'utf8'));
const localEnv = dotenv.parse(fs.readFileSync(path.join(server, '.env')));
const remoteEnv = dotenv.parse(fs.readFileSync(path.join(server, '.env.production')));
const localUrl = new URL(localEnv.DIRECT_URL || localEnv.DATABASE_URL);
const remoteUrl = new URL(remoteEnv.DIRECT_URL || remoteEnv.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(localUrl.hostname)) throw Error('Source must be localhost');
if (!remoteUrl.hostname.endsWith('.neon.tech') || remoteUrl.hostname.includes('-pooler')) throw Error('Destination must be a direct Neon connection');
fs.mkdirSync(directory, {recursive: true});
const save = (name, value) => fs.writeFileSync(path.join(directory, name), JSON.stringify(value, null, 2) + '\n');
const read = name => JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
const digest = value => createHash('sha256').update(value).digest('hex');
const quote = value => '"' + value.replaceAll('"', '""') + '"';

async function run(file, commandArgs, env = process.env) {
  try {
    return await exec(file, commandArgs, {cwd: server, env, maxBuffer: 8 * 1024 * 1024, timeout: 120000});
  } catch (error) {
    const detail = String(error.stderr || error.stdout || error.code || 'Command failed')
      .replace(/postgres(?:ql)?:\/\/[^\s"']+/g, '[REDACTED_DATABASE_URL]');
    throw Error(`${path.basename(file)} failed: ${detail.slice(0, 4000)}`);
  }
}
async function neonApi(route) {
  const cli = path.join(process.env.APPDATA, 'npm/node_modules/neon/dist/cli.js');
  return JSON.parse((await run(process.execPath, [cli, 'api', route, '--output', 'json'])).stdout);
}
async function destination(branchName) {
  const {branches} = await neonApi(`/projects/${context.projectId}/branches`);
  const branch = branches.find(b => b.name === branchName || b.id === branchName);
  if (!branch) throw Error('Requested branch does not exist');
  const {endpoints} = await neonApi(`/projects/${context.projectId}/endpoints`);
  const endpoint = endpoints.find(e => e.branch_id === branch.id && e.type === 'read_write');
  if (!endpoint) throw Error('Branch has no read-write endpoint');
  const url = new URL(remoteUrl);
  url.hostname = endpoint.host;
  return {branch, url, branches};
}
function libpqEnv(url) {
  const env = {...process.env};
  for (const key of Object.keys(env)) if (key.startsWith('PG')) delete env[key];
  Object.assign(env, {
    PGHOST: url.hostname, PGPORT: url.port || '5432',
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password),
    PGSSLMODE: url.searchParams.get('sslmode') || 'prefer', PGCONNECT_TIMEOUT: '15',
    PGOPTIONS: '-c lock_timeout=10000 -c statement_timeout=60000 -c timezone=UTC',
  });
  if (url.searchParams.has('channel_binding')) env.PGCHANNELBINDING = url.searchParams.get('channel_binding');
  return env;
}
async function snapshot(url) {
  const db = new pg.Client({connectionString: url.toString(), connectionTimeoutMillis: 15000, statement_timeout: 30000});
  try {
    await db.connect();
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    await db.query("SET LOCAL timezone='UTC'");
    const query = async sql => (await db.query(sql)).rows;
    const schema = {
      // pg_dump compacts physical slots left by previously dropped columns.
      // Compare the order of live columns, not those unused storage slots.
      columns: await query(`SELECT c.relname AS table_name,a.attname AS column_name,(row_number() OVER (PARTITION BY c.oid ORDER BY a.attnum))::int AS position,format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull AS required,a.attidentity AS identity,a.attgenerated AS generated,pg_get_expr(d.adbin,d.adrelid) AS default_value FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE n.nspname='public' AND c.relkind IN ('r','p') AND a.attnum>0 AND NOT a.attisdropped ORDER BY c.relname,a.attnum`),
      constraints: await query(`SELECT c.relname AS table_name,k.conname AS name,k.contype AS type,k.convalidated AS validated,pg_get_constraintdef(k.oid,true) AS definition FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' ORDER BY c.relname,k.conname`),
      indexes: await query(`SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname`),
      enums: await query(`SELECT t.typname,e.enumlabel,e.enumsortorder FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' ORDER BY t.typname,e.enumsortorder`),
      sequences: await query(`SELECT sequencename,data_type,start_value,min_value,max_value,increment_by,cycle,cache_size FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename`),
      views: await query(`SELECT viewname,definition FROM pg_views WHERE schemaname='public' ORDER BY viewname`),
      routines: await query(`SELECT p.proname,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind IN ('f','p') ORDER BY p.proname,pg_get_function_identity_arguments(p.oid)`),
      triggers: await query(`SELECT c.relname,t.tgname,pg_get_triggerdef(t.oid,true) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY c.relname,t.tgname`),
      policies: await query(`SELECT tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname`),
    };
    const tables = await query(`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`);
    const data = {};
    for (const {tablename} of tables) {
      data[tablename] = (await db.query(`SELECT count(*)::int AS count,md5(COALESCE(string_agg(h,'' ORDER BY h),'')) AS hash FROM (SELECT md5(to_jsonb(t)::text) AS h FROM public.${quote(tablename)} t) rows`)).rows[0];
    }
    const sequenceValues = {};
    for (const {sequencename} of schema.sequences) sequenceValues[sequencename] = (await db.query(`SELECT last_value::text,is_called FROM public.${quote(sequencename)}`)).rows[0];
    let migrations = [];
    if (data._prisma_migrations) migrations = await query('SELECT migration_name,checksum,finished_at IS NOT NULL AS finished,rolled_back_at IS NOT NULL AS rolled_back FROM public."_prisma_migrations" ORDER BY migration_name');
    await db.query('ROLLBACK');
    return {schema, data, sequenceValues, migrations, schemaHash: digest(JSON.stringify(schema)), dataHash: digest(JSON.stringify({data, sequenceValues}))};
  } finally { await db.end(); }
}
function compare(expected, actual) {
  const differences = [];
  for (const key of Object.keys(expected.schema)) if (!isDeepStrictEqual(expected.schema[key], actual.schema[key])) differences.push(`schema.${key}`);
  for (const table of new Set([...Object.keys(expected.data), ...Object.keys(actual.data)])) if (!isDeepStrictEqual(expected.data[table], actual.data[table])) differences.push(`data.${table}`);
  if (!isDeepStrictEqual(expected.sequenceValues, actual.sequenceValues)) differences.push('sequenceValues');
  return differences;
}
async function restore(url) {
  await run(path.join(pgBin, 'pg_restore.exe'), ['--clean', '--if-exists', '--no-owner', '--no-privileges', '--single-transaction', '--exit-on-error', '--dbname', decodeURIComponent(url.pathname.slice(1)), archive], libpqEnv(url));
}
function summary(value) {
  return {tableCount: Object.keys(value.data).length, appliedMigrations: value.migrations.filter(m => m.finished && !m.rolled_back).length, migrationHistoryRows: value.migrations.length, schemaHash: value.schemaHash, dataHash: value.dataHash, counts: Object.fromEntries(Object.entries(value.data).map(([table, item]) => [table, item.count]))};
}

if (stage === 'inspect') {
  console.log(JSON.stringify({local: summary(await snapshot(localUrl)), neon: summary(await snapshot(remoteUrl))}, null, 2));
} else if (stage === 'prepare') {
  if (fs.existsSync(archive)) throw Error('Archive already exists; keep the existing tested snapshot');
  const before = await snapshot(localUrl);
  const migrationNames = fs.readdirSync(path.join(server, 'prisma/migrations'), {withFileTypes: true}).filter(d => d.isDirectory()).map(d => d.name).sort();
  if (!isDeepStrictEqual(migrationNames, before.migrations.filter(m => m.finished && !m.rolled_back).map(m => m.migration_name))) throw Error('Local migration history is incomplete');
  for (const migration of before.migrations) {
    const sql = fs.readFileSync(path.join(server, 'prisma/migrations', migration.migration_name, 'migration.sql'));
    if (digest(sql) !== migration.checksum) throw Error(`Local migration checksum differs: ${migration.migration_name}`);
  }
  await run(path.join(pgBin, 'pg_dump.exe'), ['--format=custom', '--schema=public', '--no-owner', '--no-privileges', '--file', archive], libpqEnv(localUrl));
  const after = await snapshot(localUrl);
  const differences = compare(before, after);
  if (differences.length) throw Error('Local source changed during archive creation: ' + differences.join(', '));
  const archiveHash = digest(fs.readFileSync(archive));
  save('source.json', before);
  save('archive.json', {at: new Date().toISOString(), archiveHash, bytes: fs.statSync(archive).size, ...summary(before)});
  console.log(JSON.stringify({stage, archiveHash, bytes: fs.statSync(archive).size, ...summary(before)}, null, 2));
} else {
  const expected = read('source.json');
  const manifest = read('archive.json');
  const archiveHash = digest(fs.readFileSync(archive));
  if (archiveHash !== manifest.archiveHash) throw Error('Archive digest differs');
  const production = await destination(context.branch || 'production');
  if (production.url.hostname !== remoteUrl.hostname) throw Error('Configured production URL does not match linked Neon production branch');
  let target = production;
  if (stage === 'test') {
    target = await destination(option('test-branch', 'migration-sync-20261010'));
    if (target.branch.id === production.branch.id || target.branch.parent_id !== production.branch.id) throw Error('Test must be a separate child of production');
  }
  if (stage === 'apply') {
    const test = read('test.json');
    if (!test.passed || test.archiveHash !== archiveHash) throw Error('This archive has not passed restoration on a separate branch');
    if (option('confirm') !== archiveHash) throw Error('Explicit archive digest confirmation is required');
    const backup = production.branches.find(b => b.id === option('backup-branch') || b.name === option('backup-branch'));
    if (!backup || backup.id === production.branch.id || backup.parent_id !== production.branch.id) throw Error('A separate backup branch of production is required');
    save('backup.json', {id: backup.id, name: backup.name, parentId: backup.parent_id, parentLsn: backup.parent_lsn, createdAt: backup.created_at, expiresAt: backup.expires_at});
    save('production-before.json', await snapshot(production.url));
    console.log(JSON.stringify({stage: 'production-restore-start', branch: production.branch.name, backup: backup.name, archiveHash}));
  }
  if (stage !== 'verify') await restore(target.url);
  const actual = await snapshot(target.url);
  const differences = compare(expected, actual);
  const report = {at: new Date().toISOString(), stage, branch: target.branch.name, branchId: target.branch.id, archiveHash, passed: differences.length === 0, differences, ...summary(actual)};
  save(`${stage}.json`, report);
  save(`${stage}-snapshot.json`, actual);
  console.log(JSON.stringify(report, null, 2));
  if (differences.length) throw Error('Restored snapshot differs: ' + differences.join(', '));
}
