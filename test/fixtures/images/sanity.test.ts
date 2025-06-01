import { describe, it, expect } from 'vitest';
import { testImageGroups } from './index';

describe('sanity: each fixture URL resolves', () => {
  it('each loader should produce a non-empty Response', async () => {
    for (const size of ['small', 'medium', 'large'] as const) {
      for (const fmt of Object.keys(testImageGroups[size]) as Array<
        keyof typeof testImageGroups.small
      >) {
        const loader = testImageGroups[size][fmt];
        const res = await loader();

        expect(res.ok).toBe(true);

        expect(res.url).toMatch(new RegExp(`\\/${size}\\/pixelift\\.${fmt}$`));
      }
    }
  });
});
