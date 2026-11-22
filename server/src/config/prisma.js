import { PrismaClient } from '@prisma/client';
import { resolveDatabaseConfig, setActiveDatabaseState } from './database.js';

let activeUrl = process.env.DATABASE_URL || '';

export let prisma = new PrismaClient();

/**
 * Resolves online/offline Postgres configuration (auto failing over to local Postgres
 * when remote DB is unreachable) and updates the live-bound `prisma` client instance.
 */
export async function initDatabaseConnection(options = {}) {
  const selection = await resolveDatabaseConfig(options);
  setActiveDatabaseState(selection);

  if (selection.url && selection.url !== activeUrl) {
    await prisma.$disconnect().catch(() => {});
    activeUrl = selection.url;
    process.env.DATABASE_URL = selection.url;
    if (process.env.DIRECT_URL && (selection.fallbackUsed || selection.mode === 'LOCAL_EXPLICIT')) {
      process.env.DIRECT_URL = selection.url;
    }
    prisma = new PrismaClient({
      datasources: { db: { url: selection.url } },
    });
  }

  return selection;
}
