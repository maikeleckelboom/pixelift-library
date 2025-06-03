import { TestImages } from '@test/fixtures/images';
import { decode } from '@/browser';

describe('decoder in browser environment', () => {
  const testCases = TestImages.all();

  test.each(testCases)('decodes $id image correctly', async (asset) => {
    const blob = await asset.asBlob();
    const pixelData = await decode(blob);

    expect(pixelData.width).toBeGreaterThan(0);
    expect(pixelData.height).toBeGreaterThan(0);
    expect(pixelData.data.length).toBe(pixelData.width * pixelData.height * 4);
  });

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
  });

  test.concurrent('concurrent decode stress test with varying resizing', async () => {
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
  });

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

    test('decodes GIF images correctly', async () => {
      const gifAssets = TestImages.gif();

      for (const asset of gifAssets.slice(0, 3)) {
        const blob = await asset.asBlob();
        const pixelData = await decode(blob);

        expect(pixelData.width).toBeGreaterThan(0);
        expect(pixelData.height).toBeGreaterThan(0);
        expect(pixelData.data).toBeInstanceOf(Uint8ClampedArray);
      }
    });
  });
});
