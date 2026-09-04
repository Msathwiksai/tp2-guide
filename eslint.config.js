import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.pnpm-store'] },

  // Browser / React source
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // The rule that matters most here. Both bugs that cost real debugging
      // time this project — state leaking across tutorials, and a hooks-order
      // crash from a conditionally-rendered branch — are exactly what these
      // catch. Kept as warnings so they surface without blocking a build.
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',

      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Unused vars are how dead code accumulated (isGeneratingImage,
      // doubtInputRef, showComingSoon). Underscore-prefixed names opt out.
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],

      // Too noisy to enforce on a codebase that already ships; revisit later.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Node-side server code
  {
    files: ['server.mjs', '*.config.{js,ts}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // Express identifies error-handling middleware by arity, so the 4th
      // parameter must exist even when unused.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
);
