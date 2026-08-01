import app from './src/app.js';
import { config } from './src/config/index.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${config.env}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`=================================`);
});
