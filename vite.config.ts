import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import netlify from '@netlify/vite-plugin-tanstack-start';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vite';
import { warmupServerFnsPlugin } from './scripts/warmup-server-fns-plugin';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  resolve: {
    conditions: ['netlify', 'import', 'module', 'browser', 'default'],
  },
  ssr: {
    external: ['libsql', '@libsql/linux-x64-gnu'],
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart({
      router: {
        routesDirectory: 'app',
        generatedRouteTree: './routeTree.gen.ts',
        routeFileIgnorePattern: '\\.test\\.',
      },
    }),
    netlify(),
    react(),
    tailwindcss(),
    warmupServerFnsPlugin(),
  ],
});
