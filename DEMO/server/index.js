import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { initDatabaseConnection, prisma } from '../../server/src/config/prisma.js';
import { assertDemoEnvironment } from './config/demo-env.guard.js';
import { DEMO_RELAX_GROUPS } from '../shared/demo-guardrails.mjs';
import { applyDemoPolicyGroups } from './services/demo-policy.service.js';
import demoRouter from './routes/demo.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverEnvPath = path.resolve(__dirname, '../../server/.env');
dotenv.config({ path: serverEnvPath });

process.env.DB_MODE = 'local';
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

const require = createRequire(new URL('../../server/package.json', import.meta.url));
const express = require('express');
const cors = require('cors');

const dbState = await initDatabaseConnection({ argv: [...process.argv, '--local-db'] });
assertDemoEnvironment({ env: process.env, databaseUrl: dbState.url });

const [{ default: app }, { errorHandler }, { initSocket }, { configureSocketAdapter }] =
  await Promise.all([
    import('../../server/src/app.js'),
    import('../../server/src/middlewares/errorHandler.middleware.js'),
    import('../../server/src/config/socket.js'),
    import('../../server/src/config/socket-adapter.js'),
  ]);

if (process.env.DEMO_AUTO_RELAX !== 'false') {
  try {
    await applyDemoPolicyGroups(Object.keys(DEMO_RELAX_GROUPS));
    console.log('[DEMO] Policy constraint otomatis dilonggarkan (backup tersimpan).');
  } catch (error) {
    console.warn(`[DEMO] Gagal auto-relax policy saat boot: ${error.message}`);
  }
}

const demoApp = express();
const demoHttpServer = createServer(demoApp);

demoApp.use(cors({ origin: true, credentials: true }));
demoApp.use(express.json({ limit: '10mb' }));
demoApp.use('/api/demo', demoRouter);
demoApp.use(app);
demoApp.use(errorHandler);

const socketServer = initSocket(demoHttpServer);
const closeSocketAdapter = await configureSocketAdapter(socketServer);

const DEMO_PORT = Number(process.env.DEMO_PORT || 5050);

const server = demoHttpServer.listen(DEMO_PORT, () => {
  console.log('=================================');
  console.log(`[DEMO] Backend berjalan di port ${DEMO_PORT}`);
  console.log(`[DEMO] Database: ${dbState.mode} (${dbState.target})`);
  console.log(`[DEMO] Endpoint Demo: http://127.0.0.1:${DEMO_PORT}/api/demo/status`);
  console.log('=================================');
});

let shuttingDown = false;
const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  socketServer.close(async () => {
    await closeSocketAdapter().catch(() => {});
    await prisma.$disconnect().catch(() => {});
    server.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 10000).unref();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
