import { isLocalDatabaseUrl, maskDatabaseUrl } from '../../../server/src/config/database.js';

/**
 * Prevents Demo Mode from ever booting against NODE_ENV=production or a non-local Postgres host.
 */
export function assertDemoEnvironment({ env = process.env, databaseUrl = env.DATABASE_URL } = {}) {
  const mode = String(env.NODE_ENV || '').toLowerCase();
  if (mode === 'production') {
    throw new Error('Mode DEMO dilarang berjalan pada NODE_ENV=production.');
  }
  if (!isLocalDatabaseUrl(databaseUrl)) {
    throw new Error(
      `Mode DEMO hanya diizinkan pada PostgreSQL lokal (localhost/127.0.0.1); koneksi ditolak: ${maskDatabaseUrl(databaseUrl)}`
    );
  }
  return {
    safe: true,
    target: maskDatabaseUrl(databaseUrl),
  };
}
