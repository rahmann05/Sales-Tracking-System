import fs from 'node:fs';
import path from 'node:path';

/**
 * Lists all Prisma migration folder names containing a migration.sql file, sorted ascending.
 */
export function listMigrationFolders(migrationsDir) {
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && fs.existsSync(path.join(migrationsDir, entry.name, 'migration.sql'))
    )
    .map((entry) => entry.name)
    .sort();
}

/**
 * Verifies every migration folder on disk has been recorded as applied in the database.
 */
export function assertMigrationIntegrity(appliedNames = [], diskFolders = []) {
  const applied = new Set(appliedNames);
  const missing = diskFolders.filter((folder) => !applied.has(folder));
  if (missing.length > 0) {
    throw new Error(`Missing applied Prisma migrations: ${missing.join(', ')}`);
  }
  return { ok: true, total: diskFolders.length, missing: [] };
}
