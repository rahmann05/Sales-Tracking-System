import { httpServer } from './src/app.js';
import { config } from './src/config/index.js';
import { initDatabaseConnection, prisma } from './src/config/prisma.js';
import { initSocket } from './src/config/socket.js';
import { configureSocketAdapter } from './src/config/socket-adapter.js';
import { initScheduler } from './src/utils/scheduler.js';
import {
  ensureAutoInvoiceCodingDefault,
  ensureAutoPjpCodingDefault,
  ensureDefaultTaxOff,
} from './src/modules/config/services/business-code.service.js';

const PORT = config.port;

const dbState = await initDatabaseConnection();
await ensureAutoInvoiceCodingDefault().catch(() => {});
await ensureAutoPjpCodingDefault().catch(() => {});
await ensureDefaultTaxOff().catch(() => {});
if (dbState.fallbackUsed) {
  console.warn(
    `[Database] Remote primary (${dbState.primaryTarget}) tidak terjangkau; beralih otomatis ke PostgreSQL lokal (${dbState.target}).`
  );
}

const socketServer = initSocket(httpServer);
const closeSocketAdapter = await configureSocketAdapter(socketServer);

const server = httpServer.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.env}`);
  console.log(`Database: ${dbState.mode} (${dbState.target})`);
  console.log(`API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`Socket.IO enabled`);
  console.log(`=================================`);

  initScheduler();
});

let shuttingDown = false;
const gracefulShutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  socketServer.close(async () => {
    await closeSocketAdapter().catch(() => {});
    await prisma.$disconnect().catch(() => {});
    server.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 10000).unref();
};

process.once('SIGUSR2', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
