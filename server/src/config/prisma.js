import { PrismaClient } from '@prisma/client';
import {
  applyPoolerDefaults,
  resolveDatabaseConfig,
  setActiveDatabaseState,
} from './database.js';

export function prismaTransactionOptions(env = process.env) {
  return {
    maxWait: Math.max(5000, Number(env.PRISMA_TX_MAX_WAIT_MS) || 15000),
    timeout: Math.max(10000, Number(env.PRISMA_TX_TIMEOUT_MS) || 30000),
  };
}

const initialUrl = applyPoolerDefaults(process.env.DATABASE_URL || '');
let activeUrl = initialUrl;

export let prisma = new PrismaClient({
  transactionOptions: prismaTransactionOptions(),
  ...(initialUrl && initialUrl !== process.env.DATABASE_URL
    ? { datasources: { db: { url: initialUrl } } }
    : {}),
});

/**
 * Resolves online/offline Postgres configuration (auto failing over to local Postgres
 * when remote DB is unreachable) and updates the live-bound `prisma` client instance.
 */
export async function initDatabaseConnection(options = {}) {
  const selection = await resolveDatabaseConfig(options);
  setActiveDatabaseState(selection);

  const effectiveUrl = applyPoolerDefaults(selection.url);
  if (effectiveUrl && effectiveUrl !== activeUrl) {
    await prisma.$disconnect().catch(() => {});
    activeUrl = effectiveUrl;
    process.env.DATABASE_URL = selection.url;
    if (process.env.DIRECT_URL && (selection.fallbackUsed || selection.mode === 'LOCAL_EXPLICIT')) {
      process.env.DIRECT_URL = selection.url;
    }
    prisma = new PrismaClient({
      datasources: { db: { url: effectiveUrl } },
      transactionOptions: prismaTransactionOptions(),
    });
  }

  return selection;
}
