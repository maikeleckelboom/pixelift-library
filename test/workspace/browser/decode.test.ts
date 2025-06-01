import { TestImages } from '@test/fixtures/images';
import { decode } from '@/browser';
import { CanvasPool } from '@/browser/decoders/canvas/pool/canvas-pool.ts';

describe('decoder in browser environment', () => {
  const testCases = TestImages.all();

  test.each(testCases)(
    'decodes $id image correctly',
    async (asset) => {
      const blob = await asset.asBlob();
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

    // Use a subset of test cases for resize testing to keep it manageable
    const resizeTestCases = TestImages.oneOfEach();

    for (const asset of resizeTestCases) {
      for (const resize of resizeOptions) {
        const blob = await asset.asBlob();
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

      const availableAssets = TestImages.all();

      const decodePromises = Array.from({ length: concurrency }, async (_, i) => {
        // Pick random asset
        const asset = availableAssets[Math.floor(Math.random() * availableAssets.length)]!;
        const blob = await asset.asBlob();

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

    const asset = TestImages.get('small', 'png');
    const blob = await asset.asBlob();

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

  test('handles different input types from same asset', async () => {
    const asset = TestImages.get('medium', 'jpeg');

    // Test blob input
    const blob = await asset.asBlob();
    const pixelDataFromBlob = await decode(blob);

    // Test ArrayBuffer input
    const arrayBuffer = await asset.asArrayBuffer();
    const pixelDataFromBuffer = await decode(arrayBuffer);

    // Results should be identical
    expect(pixelDataFromBlob.width).toBe(pixelDataFromBuffer.width);
    expect(pixelDataFromBlob.height).toBe(pixelDataFromBuffer.height);
    expect(pixelDataFromBlob.data.length).toBe(pixelDataFromBuffer.data.length);
  });

  describe('format-specific decoding', () => {
    test('decodes JPEG images correctly', async () => {
      const jpegAssets = TestImages.jpeg();

      for (const asset of jpegAssets.slice(0, 3)) {
        // Test first 3 to keep it fast
        const blob = await asset.asBlob();
        const pixelData = await decode(blob);

        expect(pixelData.width).toBeGreaterThan(0);
        expect(pixelData.height).toBeGreaterThan(0);
        expect(pixelData.data).toBeInstanceOf(Uint8ClampedArray);
      }
    });

    test('decodes PNG images correctly', async () => {
      const pngAssets = TestImages.png();

      for (const asset of pngAssets.slice(0, 3)) {
        const blob = await asset.asBlob();
        const pixelData = await decode(blob);

        expect(pixelData.width).toBeGreaterThan(0);
        expect(pixelData.height).toBeGreaterThan(0);
        expect(pixelData.data).toBeInstanceOf(Uint8ClampedArray);
      }
    });

    test('decodes WebP images correctly', async () => {
      const webpAssets = TestImages.webp();

      for (const asset of webpAssets.slice(0, 3)) {
        const blob = await asset.asBlob();
        const pixelData = await decode(blob);

        expect(pixelData.width).toBeGreaterThan(0);
        expect(pixelData.height).toBeGreaterThan(0);
        expect(pixelData.data).toBeInstanceOf(Uint8ClampedArray);
      }
    });
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

    test('pool integrates with decode operations', async () => {
      // Test that the decode function properly uses the canvas pool
      const asset = TestImages.get('small', 'png');
      const blob = await asset.asBlob();

      // Multiple concurrent decodes should work without issues
      const decodePromises = Array.from({ length: 5 }, () =>
        decode(blob, { resize: { width: 50, height: 50, fit: 'cover' } })
      );

      const results = await Promise.all(decodePromises);

      for (const pixelData of results) {
        expect(pixelData.width).toBe(50);
        expect(pixelData.height).toBe(50);
        expect(pixelData.data.length).toBe(50 * 50 * 4);
      }
    });

    test('pool handles different canvas sizes', async () => {
      const pool1 = new CanvasPool(50, 50, 1);
      const pool2 = new CanvasPool(100, 100, 1);

      const canvas1 = await pool1.acquire();
      const canvas2 = await pool2.acquire();

      expect(canvas1.width).toBe(50);
      expect(canvas1.height).toBe(50);
      expect(canvas2.width).toBe(100);
      expect(canvas2.height).toBe(100);

      pool1.release(canvas1);
      pool2.release(canvas2);

      pool1.dispose();
      pool2.dispose();
    });
  });
});
