import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'nuxt-example',
      testDir: './apps/nuxt-example/tests/e2e',
      use: {
        baseURL: 'http://localhost:3000'
      }
    }
  ],
  webServer: {
    command: 'pnpm --filter nuxt-example dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
