import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const clientDir = path.resolve(repoRoot, 'client');
const demoMainFsPath = path.resolve(__dirname, 'src/main.jsx').replaceAll('\\', '/');
const demoPort = Number(process.env.DEMO_PORT || 5050);

const require = createRequire(new URL('../../client/package.json', import.meta.url));
const { defineConfig } = require('vite');
const reactPlugin = require('@vitejs/plugin-react');
const react = reactPlugin.default || reactPlugin;

const resolvePkgDir = (pkg) => path.dirname(require.resolve(`${pkg}/package.json`));

const demoEntryPlugin = () => ({
  name: 'demo-entry-html',
  transformIndexHtml(html) {
    return html
      .replace(
        '<title>Sinar Anugrah - SalesFlow Tracking & Route Optimizer</title>',
        '<title>[DEMO] Sinar Anugrah - Mode Uji Alur</title>'
      )
      .replace('/src/main.jsx', `/@fs/${demoMainFsPath}`);
  },
});

const proxyTarget = `http://127.0.0.1:${demoPort}`;

export default defineConfig({
  root: clientDir,
  plugins: [react(), demoEntryPlugin()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: resolvePkgDir('react'),
      'react-dom': resolvePkgDir('react-dom'),
      leaflet: resolvePkgDir('leaflet'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../dist-client'),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    host: true,
    fs: {
      allow: [repoRoot],
    },
    proxy: {
      '/api/demo': { target: proxyTarget, changeOrigin: true },
      '/api': { target: proxyTarget, changeOrigin: true },
      '/uploads': { target: proxyTarget, changeOrigin: true },
      '/socket.io': { target: proxyTarget, changeOrigin: true, ws: true },
    },
  },
});
