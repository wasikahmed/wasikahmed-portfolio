import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // esbuild's bundled seed scripts (pnpm build:scripts) — generated
    // output, not source, and gitignored. Linting them reported 152
    // warnings from inside bundled dependencies.
    'dist-scripts/**',
  ]),
]);

export default eslintConfig;
