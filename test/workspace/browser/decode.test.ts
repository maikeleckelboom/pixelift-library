import { describe, test, expect } from 'vitest';
import type { ImageFormat, ImageLoader, ImageGroups } from '@test/fixtures/images';
import { testImageGroups } from '@test/fixtures/images';
import { decode } from '@/browser';

interface TestCase {
  size: keyof ImageGroups;
  format: ImageFormat;
  loader: ImageLoader;
}

function getTestCases(): TestCase[] {
  return (Object.keys(testImageGroups) as (keyof ImageGroups)[]).flatMap((size) => {
    const formatLoaders = testImageGroups[size] as Record<
      ImageFormat,
      ImageLoader | undefined
    >;
    return Object.entries(formatLoaders)
      .filter(([, loader]) => loader)
      .map(([format, loader]) => ({
        size,
        format: format as ImageFormat,
        loader: loader as ImageLoader
      }));
  });
}

async function loadBlob(loader: ImageLoader): Promise<Blob> {
  const response = await loader();
  if (!response.ok) {
    throw new Error(
      `Failed to fetch image for decode test: ${response.status} ${response.statusText}`
    );
  }
  return response.blob();
}

describe('decoder in browser environment', () => {
  const testCases = getTestCases();

  test.each(testCases)('decodes $size $format image correctly', async ({ loader }) => {
    if (!loader) {
      throw new Error('ImageLoader is undefined, skipping test');
    }
    const blob = await loadBlob(loader);
    const pixelData = await decode(blob);

    expect(pixelData.width).toBeGreaterThan(0);
    expect(pixelData.height).toBeGreaterThan(0);
    expect(pixelData.data.length).toBe(pixelData.width * pixelData.height * 4);
  });

  test('decodes with resizing across all formats and sizes', async () => {
    const resize = { width: 20, height: 20, fit: 'cover' as const };

    for (const { loader } of testCases) {
      if (!loader) {
        continue; // skip if loader undefined
      }
      const blob = await loadBlob(loader);
      const pixelData = await decode(blob, { resize });

      expect(pixelData.width).toBe(resize.width);
      expect(pixelData.height).toBe(resize.height);
      expect(pixelData.data.length).toBe(resize.width * resize.height * 4);
    }
  });

  test('stress test: decodes many images concurrently', async () => {
    const concurrency = 20;
    const resize = { width: 32, height: 32, fit: 'cover' as const };
    const blobs: Blob[] = [];

    for (let i = 0; i < concurrency; i++) {
      const loader = testCases[i % testCases.length]?.loader;
      if (!loader) {
        throw new Error(`Loader missing for concurrency index ${i}`);
      }
      blobs.push(await loadBlob(loader));
    }

    const results = await Promise.all(blobs.map((blob) => decode(blob, { resize })));

    for (const pixelData of results) {
      expect(pixelData.width).toBe(resize.width);
      expect(pixelData.height).toBe(resize.height);
      expect(pixelData.data.length).toBe(resize.width * resize.height * 4);
    }
  }, 20_000);

  test('stress test: concurrent decodes with frequent resizing', async () => {
    const concurrency = 20;
    const resizeOptions = [
      { width: 16, height: 16, fit: 'cover' as const },
      { width: 32, height: 24, fit: 'contain' as const },
      { width: 48, height: 48, fit: 'fill' as const },
      { width: 64, height: 32, fit: 'cover' as const }
    ];

    const blobs: Blob[] = [];
    for (let i = 0; i < concurrency; i++) {
      const loader = testCases[i % testCases.length]?.loader;
      if (!loader) {
        throw new Error(`Loader missing for concurrent resizing test at index ${i}`);
      }
      blobs.push(await loadBlob(loader));
    }

    const results = await Promise.all(
      blobs.map((blob, i) => {
        const resize = i % 10 === 0 ? undefined : resizeOptions[i % resizeOptions.length];
        return decode(blob, resize ? { resize } : undefined);
      })
    );

    results.forEach((pixelData, i) => {
      if (i % 10 === 0) {
        expect(pixelData.width).toBeGreaterThan(0);
        expect(pixelData.height).toBeGreaterThan(0);
        expect(pixelData.data.length).toBe(pixelData.width * pixelData.height * 4);
      } else {
        const expected = resizeOptions[i % resizeOptions.length]!;
        expect(pixelData.width).toBe(expected.width);
        expect(pixelData.height).toBe(expected.height);
        expect(pixelData.data.length).toBe(expected.width * expected.height * 4);
      }
    });
  }, 20_000);

  test.concurrent(
    'stress test: concurrent decode stress test with frequent resizing',
    async () => {
      const concurrencyLevel = 20;
      const resizeOptions = [
        { width: 16, height: 16, fit: 'cover' as const },
        { width: 32, height: 24, fit: 'contain' as const },
        { width: 48, height: 48, fit: 'fill' as const },
        { width: 64, height: 32, fit: 'cover' as const }
      ];

      const keys = testCases.map(({ size, format }) => ({ size, format }));

      const decodePromises = Array.from({ length: concurrencyLevel }, async (_, i) => {
        const randomIndex = Math.floor(Math.random() * keys.length);
        const { size, format } = keys[randomIndex]!;
        const loader = testImageGroups[size]?.[format];
        if (!loader) {
          throw new Error(`Loader missing for random key ${size} ${format}`);
        }

        const blob = await loadBlob(loader);

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
    20_000
  );
});
