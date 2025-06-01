import { CanvasPool } from '@/browser/decoders/canvas/pool/canvas-pool.ts';
import { TestImages } from '@test/fixtures/images';
import { decode } from '@/browser';

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
