import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

const handleProxyError = (proxy, prefix) => {
  proxy.on('error', (err, req, res) => {
    // Ignore transient ECONNRESET and ECONNREFUSED during dev server restarts or page reloads
    if (['ECONNRESET','ECONNREFUSED','ETIMEDOUT'].includes(err.code)) {
      if (res && !res.headersSent && typeof res.writeHead === 'function') {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success:false, message:'Backend sementara belum dapat dihubungi. Coba kembali beberapa saat lagi.', code:'BACKEND_UNAVAILABLE' }));
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
  build: {
    rollupOptions: {output: {manualChunks(id) {
      if(!id.includes('node_modules'))return;
      if(/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id))return 'react-vendor';
      if(/node_modules[\\/](leaflet|react-leaflet|@react-leaflet)[\\/]/.test(id))return 'maps-vendor';
      if(id.includes('@react-google-maps'))return 'google-maps-vendor';
    }}},
  },
  server: {
    port: 5173,
    host: true, // Enable network access so it can be accessed from mobile
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        proxyTimeout: 30000,
        timeout: 35000,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => handleProxyError(proxy, 'api'),
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        proxyTimeout: 30000,
        timeout: 35000,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => handleProxyError(proxy, 'uploads'),
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        proxyTimeout: 30000,
        timeout: 35000,
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy) => handleProxyError(proxy, 'socket.io'),
      }
    },
  },
});
