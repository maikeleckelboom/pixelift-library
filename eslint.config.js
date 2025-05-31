import { defineConfig } from 'eslint/config';
import tslint from 'typescript-eslint';
import parser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default defineConfig([
  ...tslint.configs.strict,
  prettier,
  {
    ignores: ['dist/', '**/*.d.ts', 'coverage/', 'node_modules/']
  },
  {
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    }
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  }
]);
