import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const ROOT_ENV_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');

let activeDatabaseState = {
  mode: isLocalDatabaseUrl(process.env.DATABASE_URL) ? 'LOCAL_PRIMARY' : 'REMOTE_PRIMARY',
  target: maskDatabaseUrl(process.env.DATABASE_URL),
  primaryTarget: maskDatabaseUrl(process.env.DATABASE_URL),
  fallbackUsed: false,
  fallbackReason: null,
};

/**
 * Returns true when a Postgres connection string points to the local loopback host.
 */
export function isLocalDatabaseUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const parsed = new URL(urlString);
    return LOCAL_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Strips credentials from a database URL for safe health and startup logging.
 */
export function maskDatabaseUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return 'unconfigured';
  try {
    const parsed = new URL(urlString);
    const port = parsed.port || '5432';
    const dbName = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '';
    return `${parsed.hostname}:${port}${dbName}`;
  } catch {
    return 'invalid';
  }
}

/**
 * Reads a local Postgres fallback URL from `server/.env` when present and loopback-hosted.
 */
export function readLocalEnvDatabaseUrl(envPath = ROOT_ENV_PATH) {
  try {
    if (!fs.existsSync(envPath)) return '';
    const parsed = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
    return isLocalDatabaseUrl(parsed.DATABASE_URL) ? parsed.DATABASE_URL : '';
  } catch {
    return '';
  }
}

/**
 * Probes TCP reachability for a remote Postgres endpoint within `timeoutMs`.
 */
export function checkTcpReachable(host, port = 5432, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

/**
 * Resolves whether to connect to the primary DB or fail over to local PostgreSQL when offline.
 */
export async function resolveDatabaseConfig({
  env = process.env,
  argv = process.argv,
  probe = checkTcpReachable,
  localEnvFallbackUrl,
} = {}) {
  const modeFlag = String(env.DB_MODE || '').toLowerCase();
  const requestedMode =
    argv.includes('--local-db') || modeFlag === 'local'
      ? 'local'
      : modeFlag === 'remote'
        ? 'remote'
        : 'auto';

  const primaryUrl = env.DATABASE_URL || '';
  const fallbackCandidate =
    localEnvFallbackUrl !== undefined ? localEnvFallbackUrl : readLocalEnvDatabaseUrl();
  const localUrl =
    env.LOCAL_DATABASE_URL ||
    (isLocalDatabaseUrl(primaryUrl) ? primaryUrl : fallbackCandidate) ||
    '';
  const timeoutMs = Math.max(300, Number(env.DB_FALLBACK_TIMEOUT_MS) || 2500);

  if (requestedMode === 'local') {
    if (!localUrl) {
      throw new Error(
        'DB_MODE=local memerlukan LOCAL_DATABASE_URL atau DATABASE_URL lokal di server/.env'
      );
    }
    return {
      url: localUrl,
      mode: 'LOCAL_EXPLICIT',
      target: maskDatabaseUrl(localUrl),
      primaryTarget: maskDatabaseUrl(primaryUrl),
      fallbackUsed: false,
      fallbackReason: null,
    };
  }

  if (requestedMode === 'remote' || !primaryUrl || isLocalDatabaseUrl(primaryUrl) || !localUrl) {
    const effectiveUrl = primaryUrl || localUrl;
    const isLocal = isLocalDatabaseUrl(effectiveUrl);
    return {
      url: effectiveUrl,
      mode: isLocal ? 'LOCAL_PRIMARY' : 'REMOTE_PRIMARY',
      target: maskDatabaseUrl(effectiveUrl),
      primaryTarget: maskDatabaseUrl(primaryUrl),
      fallbackUsed: false,
      fallbackReason: null,
    };
  }

  let host = '';
  let port = 5432;
  try {
    const parsed = new URL(primaryUrl);
    host = parsed.hostname;
    port = Number(parsed.port) || 5432;
  } catch {
    host = '';
  }

  const reachable = host ? await probe(host, port, timeoutMs) : false;
  if (reachable) {
    return {
      url: primaryUrl,
      mode: 'REMOTE_PRIMARY',
      target: maskDatabaseUrl(primaryUrl),
      primaryTarget: maskDatabaseUrl(primaryUrl),
      fallbackUsed: false,
      fallbackReason: null,
    };
  }

  return {
    url: localUrl,
    mode: 'LOCAL_FALLBACK',
    target: maskDatabaseUrl(localUrl),
    primaryTarget: maskDatabaseUrl(primaryUrl),
    fallbackUsed: true,
    fallbackReason: 'PRIMARY_UNREACHABLE',
  };
}

export const getActiveDatabaseState = () => ({ ...activeDatabaseState });

export const setActiveDatabaseState = (state) => {
  activeDatabaseState = { ...state };
};
