import { httpServer } from './src/app.js';
import { config } from './src/config/index.js';
import { initSocket } from './src/config/socket.js';
import {configureSocketAdapter} from './src/config/socket-adapter.js';
import { initScheduler } from './src/utils/scheduler.js';

const PORT = config.port;

// Initialize Socket.IO with httpServer
const socketServer=initSocket(httpServer);
const closeSocketAdapter=await configureSocketAdapter(socketServer);

const server = httpServer.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.env}`);
  console.log(`API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`Socket.IO enabled`);
  console.log(`=================================`);

  // Initialize daily PJP cron scheduler
  initScheduler();
});

// Graceful shutdown for nodemon & process signals
let shuttingDown=false;
const gracefulShutdown = () => {
  if(shuttingDown)return;shuttingDown=true;
  socketServer.close(async()=>{await closeSocketAdapter();server.close(()=>process.exit(0));});
  setTimeout(() => process.exit(0), 10000).unref();
};

process.once('SIGUSR2', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
