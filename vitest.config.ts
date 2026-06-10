import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.test.{ts,tsx}', 'app/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**'],
    env: {
      TURSO_DATABASE_URL: ':memory:',
      TURSO_AUTH_TOKEN: '',
      BETTER_AUTH_URL: 'http://localhost:3000',
      BETTER_AUTH_SECRET: 'test-secret-key-at-least-32-chars-long',
    },
  },
});
