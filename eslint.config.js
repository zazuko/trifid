import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';

export default defineConfig(
  // Build outputs and generated artifacts
  globalIgnores([
    '**/dist/',
    '**/coverage/',
    'packages/yasgui/build/',
  ]),

  js.configs.recommended,
  tseslint.configs.recommended,

  // Consistent formatting: semicolons, trailing commas on multiline,
  // single quotes, 2-space indentation.
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: true,
    commaDangle: 'always-multiline',
    braceStyle: '1tbs',
    arrowParens: true,
    jsx: false,
  }),

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // Keep console usage deliberate (build scripts disable it inline)
      'no-console': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-var': 'error',
      'prefer-const': 'error',

      // `_`-prefixed parameters/variables mark intentionally unused values
      '@typescript-eslint/no-unused-vars': ['error', {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],

      // `any` is used deliberately at untyped boundaries (RDF/clownface/lit)
      '@typescript-eslint/no-explicit-any': 'off',

      // `@ts-expect-error` is used in tests to assert invalid configurations;
      // `@ts-ignore` must explain why it is needed
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-expect-error': false,
        'ts-ignore': 'allow-with-description',
      }],
    },
  },

  // Browser-served scripts (loaded raw or bundled with esbuild)
  {
    files: [
      'packages/graph-explorer/static/**/*.js',
      'packages/yasgui/plugins/**/*.js',
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
);
