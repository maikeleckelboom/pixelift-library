import {defineConfig} from 'vitest/config';
import SnapshotLastSequencer from "./test/fixtures/snapshot-last-sequencer";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

const commonOptions = {
    extends: true,
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@test': path.resolve(__dirname, 'test'),
        }
    },
    testTimeout: 30_000,
} as const;

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        isolate: true,
        sequence: {sequencer: SnapshotLastSequencer},
        exclude: [],
        workspace: [
            {
                ...commonOptions,
                test: {
                    name: 'node',
                    environment: 'node',
                    include: ['test/workspace/server/**/*.test.ts', 'test/workspace/shared/**/*.test.ts'],
                    benchmark: {include: ['test/workspace/server/**/*.bench.ts']},
                    // exclude: ['**/*slow*.test.ts'],
                }
            },
            {
                ...commonOptions,
                test: {
                    name: 'browser',
                    environment: 'happy-dom',
                    setupFiles: ['test/workspace/setup.ts'],
                    include: ['test/workspace/browser/**/*.test.ts', 'test/workspace/shared/**/*.test.ts'],
                    benchmark: {include: ['test/workspace/browser/**/*.bench.ts']},
                    browser: {
                        provider: 'playwright',
                        enabled: true,
                        headless: true,
                        screenshotFailures: false,
                        instances: [
                            {browser: 'chromium'},
                            {browser: 'firefox'},
                            {browser: 'webkit'}
                        ]
                    },
                    // exclude: ['**/*slow*.test.ts'],
                }
            }
        ]
    }
});
