import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

const handleProxyError = (proxy, prefix) => {
  proxy.on('error', (err, req, res) => {
    // Ignore transient ECONNRESET and ECONNREFUSED during dev server restarts or page reloads
    if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
      if (res && !res.headersSent && typeof res.writeHead === 'function') {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Backend server restarting', code: err.code }));
      }
      return;
    }
    console.warn(`[vite proxy error: ${prefix}]`, err.message);
  });
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    port: 5173,
    host: true, // Enable network access so it can be accessed from mobile
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => handleProxyError(proxy, 'api'),
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => handleProxyError(proxy, 'uploads'),
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy) => handleProxyError(proxy, 'socket.io'),
      }
    },
  },
});
