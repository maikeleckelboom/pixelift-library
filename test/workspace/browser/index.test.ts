import { decode } from '@/index';
import { TestImages } from '@test/fixtures/images';

describe('decoder in browser environment', () => {
  const testCases = TestImages.all();

  test.each(testCases)('decodes $id image correctly', async (asset) => {
    const blob = await asset.asBlob();
    const pixelData = await decode(blob);

    expect(pixelData.width).toBeGreaterThan(0);
    expect(pixelData.height).toBeGreaterThan(0);
    expect(pixelData.data.length).toBe(pixelData.width * pixelData.height * 4);
  });

  test('decodes with resizing across all formats and sizes', async () => {
    const resize = { width: 20, height: 20, fit: 'cover' as const };

    for (const asset of testCases) {
      const blob = await asset.asBlob();
      const pixelData = await decode(blob, { resize });

      expect(pixelData.width).toBe(resize.width);
      expect(pixelData.height).toBe(resize.height);
      expect(pixelData.data.length).toBe(resize.width * resize.height * 4);
    }
  });

  test('handles blob input correctly', async () => {
    const asset = TestImages.get('small', 'png');
    const blob = await asset.asBlob();

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);

    const pixelData = await decode(blob);
    expect(pixelData.data).toBeInstanceOf(Uint8ClampedArray);
  });

  test('can handle different input formats from same asset', async () => {
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

  test('performance test with multiple formats', async () => {
    const testAssets = TestImages.oneOfEach();

    const startTime = performance.now();

    for (const asset of testAssets) {
      const blob = await asset.asBlob();
      const pixelData = await decode(blob);
      expect(pixelData.width).toBeGreaterThan(0);
    }

    const endTime = performance.now();
    console.log(`Decoded ${testAssets.length} images in ${endTime - startTime}ms`);
  });
});
