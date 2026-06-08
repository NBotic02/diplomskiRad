import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Per-prefix proxy keeps the four Spring Boot services CORS-free in dev.
// In production the same routing is served by nginx (see nginx.conf).
const apiProxy = (target: string) => ({
  target,
  changeOrigin: true,
  secure: false,
});

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // strictPort: 5173 must be the dev server port — Auth0 only allows
    // callbacks to that exact origin, so silently falling back to 5174
    // would break login on every restart.
    strictPort: true,
    proxy: {
      // case-service (8081)
      '^/api/v1/(customers|cases|case-categories|sla-policies|workflow-failures)': apiProxy('http://localhost:8081'),
      // employee-service (8082)
      '^/api/v1/(agents|skills|departments|shifts|exceptions)':        apiProxy('http://localhost:8082'),
      // notification-service (8083)
      '^/api/v1/(notifications|notification-rules|notification-preferences)': apiProxy('http://localhost:8083'),
      // analytics-service (8084)
      '^/api/v1/(metrics|bottlenecks)':                                apiProxy('http://localhost:8084'),
    },
  },
});
