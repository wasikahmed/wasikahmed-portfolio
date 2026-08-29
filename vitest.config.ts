import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // The package's own `react-server`-conditional export — an
      // intentionally empty module — swapped in for its default export
      // (an unconditional throw, meant to fail a Client Component build)
      // so server-only modules like queries.ts and db.ts can be imported
      // directly in tests. Vite doesn't resolve export conditions the way
      // Next's bundler does, so without this every test importing anything
      // under `import 'server-only'` fails immediately on import.
      'server-only': path.resolve(__dirname, './node_modules/server-only/empty.js'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**'],
  },
});
