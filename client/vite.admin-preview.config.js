import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],build:{outDir:'dist-admin-preview',rollupOptions:{input:'admin-preview.html'}},server:{host:'127.0.0.1',proxy:{'/api':{target:'http://127.0.0.1:5000',changeOrigin:true},'/socket.io':{target:'http://127.0.0.1:5000',ws:true},'/uploads':{target:'http://127.0.0.1:5000'}}}});
