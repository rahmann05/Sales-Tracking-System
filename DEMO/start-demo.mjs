import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const demoDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(demoDir, '..');
const clientDir = path.join(repoRoot, 'client');
const viteBin = path.join(clientDir, 'node_modules', 'vite', 'bin', 'vite.js');
const demoPort = process.env.DEMO_PORT || '5050';
const demoClientPort = process.env.DEMO_CLIENT_PORT || '5174';

const backend = spawn(process.execPath, [path.join(demoDir, 'server', 'index.js')], {
  cwd: repoRoot,
  env: { ...process.env, DB_MODE: 'local', DEMO_PORT: demoPort },
  stdio: 'inherit',
});

const frontend = spawn(
  process.execPath,
  [
    viteBin,
    '--config',
    path.join(demoDir, 'client', 'vite.demo.config.js'),
    '--port',
    demoClientPort,
  ],
  {
    cwd: clientDir,
    env: { ...process.env, DEMO_PORT: demoPort },
    stdio: 'inherit',
  }
);

console.log(`[DEMO] Backend  : http://127.0.0.1:${demoPort}/api/demo/status`);
console.log(`[DEMO] Frontend : http://127.0.0.1:${demoClientPort}/`);

let shuttingDown = false;
const shutdown = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  if (!backend.killed) backend.kill('SIGTERM');
  if (!frontend.killed) frontend.kill('SIGTERM');
  setTimeout(() => process.exit(code), 300).unref();
};

backend.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`[DEMO] Backend berhenti (exit ${code ?? 1}). Menutup frontend demo...`);
    shutdown(code || 1);
  }
});

frontend.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`[DEMO] Frontend berhenti (exit ${code ?? 1}). Menutup backend demo...`);
    shutdown(code || 1);
  }
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
