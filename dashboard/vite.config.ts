import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3002,
        proxy: {
            '/api': {
                target: 'http://localhost:8083',
                changeOrigin: true,
            },
            '/ai-api': {
                target: 'http://localhost:8005',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/ai-api/, '/api/v1')
            }
        },
    },
});
