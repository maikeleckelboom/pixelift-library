import { getTestCases, loadBlob, testImageGroups } from '@test/fixtures/images';
import { decode } from '@/browser';
import { CanvasPool } from '@/browser/decoders/canvas/pool/canvas-pool.ts';

describe('decoder in browser environment', () => {
  const testCases = getTestCases();

  test.each(testCases)(
    'decodes $size $format image correctly',
    async ({ loader }) => {
      if (!loader) throw new Error('TestImageLoader is undefined, skipping test');
      const blob = await loadBlob(loader);
      const pixelData = await decode(blob);

      expect(pixelData.width).toBeGreaterThan(0);
      expect(pixelData.height).toBeGreaterThan(0);
      expect(pixelData.data.length).toBe(pixelData.width * pixelData.height * 4);
    },
    60_000
  );

  test('decodes images with and without resizing', async () => {
    const resizeOptions = [
      undefined,
      { width: 20, height: 20, fit: 'cover' as const },
      { width: 32, height: 24, fit: 'contain' as const },
      { width: 48, height: 48, fit: 'fill' as const }
    ];

    for (const { loader } of testCases) {
      if (!loader) continue;

      for (const resize of resizeOptions) {
        const blob = await loadBlob(loader);
        const pixelData = await decode(blob, resize ? { resize } : undefined);

        if (resize) {
          expect(pixelData.width).toBe(resize.width);
          expect(pixelData.height).toBe(resize.height);
          expect(pixelData.data.length).toBe(resize.width * resize.height * 4);
        } else {
          expect(pixelData.width).toBeGreaterThan(0);
          expect(pixelData.height).toBeGreaterThan(0);
          expect(pixelData.data.length).toBe(pixelData.width * pixelData.height * 4);
        }
      }
    }
  }, 120_000);

  test.concurrent(
    'concurrent decode stress test with varying resizing',
    async () => {
      const concurrency = 20;
      const resizeOptions = [
        { width: 16, height: 16, fit: 'cover' as const },
        { width: 32, height: 24, fit: 'contain' as const },
        { width: 48, height: 48, fit: 'fill' as const },
        { width: 64, height: 32, fit: 'cover' as const }
      ];

      const keys = testCases.map(({ size, format }) => ({ size, format }));

      const decodePromises = Array.from({ length: concurrency }, async (_, i) => {
        const { size, format } = keys[Math.floor(Math.random() * keys.length)]!;
        const loader = testImageGroups[size]?.[format];
        if (!loader) throw new Error(`Loader missing for random key ${size} ${format}`);

        const blob = await loadBlob(loader);
        // Every 5th decode no resize, else random resize
        const resize = i % 5 === 0 ? undefined : resizeOptions[i % resizeOptions.length];
        const pixelData = await decode(blob, resize ? { resize } : undefined);

        if (resize) {
          expect(pixelData.width).toBe(resize.width);
          expect(pixelData.height).toBe(resize.height);
          expect(pixelData.data.length).toBe(resize.width * resize.height * 4);
        } else {
          expect(pixelData.width).toBeGreaterThan(0);
          expect(pixelData.height).toBeGreaterThan(0);
          expect(pixelData.data.length).toBe(pixelData.width * pixelData.height * 4);
        }
      });

      await Promise.all(decodePromises);
    },
    30_000
  );

  test('aborts decode operation when signal aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    const blob = await loadBlob(testImageGroups.small.png);
    await expect(decode(blob, { signal: controller.signal })).rejects.toThrow();
  });

  test('rejects non-image content types', async () => {
    const nonImageResponses = [
      new Response('Not an image', { headers: { 'Content-Type': 'text/html' } }),
      new Response('<html lang="en"></html>', { headers: { 'Content-Type': 'text/html' } }),
      new Response(JSON.stringify({}), { headers: { 'Content-Type': 'application/json' } })
    ];

    for (const resp of nonImageResponses) {
      await expect(decode(resp)).rejects.toThrow();
    }
  });

  describe('CanvasPool behavior', () => {
    test('handles pool exhaustion and aborts queued tasks gracefully', async () => {
      const pool = new CanvasPool(100, 100, 1);

      const acquire1 = pool.acquire();
      const acquire2 = pool.acquire();
      const abortController = new AbortController();
      const acquire3 = pool.acquire(abortController.signal);
      abortController.abort();

      const canvas1 = await acquire1;
      pool.release(canvas1);

      await expect(acquire3).rejects.toThrow('Operation aborted');
      await expect(acquire2).resolves.toBeInstanceOf(OffscreenCanvas);

      pool.dispose();
    });

    test('reuses canvases properly and grows when needed', async () => {
      const pool = new CanvasPool(100, 100, 2);
      const canvas1 = await pool.acquire();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const canvas2 = await pool.acquire();
      const acquire3 = pool.acquire();
      pool.release(canvas1);
      const canvas3 = await acquire3;
      expect(canvas3).toBe(canvas1);
      expect(pool['pool'].length).toBe(2);
      pool.dispose();
    });
  });
});
