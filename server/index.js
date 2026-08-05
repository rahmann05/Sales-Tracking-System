import { httpServer } from './src/app.js';
import { config } from './src/config/index.js';
import { initSocket } from './src/config/socket.js';
import { initScheduler } from './src/utils/scheduler.js';

const PORT = config.port;

httpServer.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${config.env}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`🔌 Socket.IO enabled`);
  console.log(`=================================`);

  // Initialize Socket.IO (must be after listen)
  initSocket(httpServer);

  // Initialize daily PJP cron scheduler
  initScheduler();
});
