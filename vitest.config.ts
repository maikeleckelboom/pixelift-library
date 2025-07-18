import { defineConfig, type TestProjectConfiguration } from 'vitest/config';
import SnapshotLastSequencer from './test/fixtures/snapshot-last-sequencer';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';

const commonOptions: TestProjectConfiguration = {
  extends: true,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@test': path.resolve(__dirname, 'test')
    }
  }
} as const;

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    isolate: true,
    sequence: { sequencer: SnapshotLastSequencer },
    testTimeout: 0,
    exclude: [],
    workspace: [
      // Node project
      {
        ...commonOptions,
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'test/workspace/node/**/*.test.ts',
            'test/workspace/shared/**/*.test.ts'
          ],
          benchmark: {
            include: ['test/workspace/node/**/*.bench.ts']
          }
        }
      },

      // Browser project
      {
        ...commonOptions,
        test: {
          name: 'browser',
          environment: 'happy-dom',
          include: [
            'test/workspace/browser/**/*.test.ts',
            'test/workspace/shared/**/*.test.ts'
          ],
          benchmark: {
            include: ['test/workspace/browser/**/*.bench.ts']
          },
          browser: {
            provider: 'playwright',
            enabled: true,
            headless: true,
            screenshotFailures: false,
            instances: [
              { browser: 'chromium' }
              // { browser: 'firefox' },
              // { browser: 'webkit' }
            ]
          }
        }
      }
    ]
  }
});
