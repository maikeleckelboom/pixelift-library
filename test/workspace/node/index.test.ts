import { TestImages } from '@test/fixtures/images';
import { decode } from '@/node';

describe('decoder in node environment', () => {
  const testCases = TestImages.all();

  test.each(testCases)('decodes $id image correctly', async (asset) => {
    const arrayBuffer = await asset.asArrayBuffer();
    const pixelData = await decode(arrayBuffer);

    expect(pixelData.width).toBeGreaterThan(0);
    expect(pixelData.height).toBeGreaterThan(0);
    expect(pixelData.data.length).toBe(pixelData.width * pixelData.height * 4);
  });

  test('decodes with resizing', async () => {
    const resizeOptions = { width: 100, height: 100, fit: 'cover' as const };

    for (const asset of testCases) {
      const arrayBuffer = await asset.asArrayBuffer();
      const pixelData = await decode(arrayBuffer, { resize: resizeOptions });

      expect(pixelData.width).toBe(100);
      expect(pixelData.height).toBe(100);
      expect(pixelData.data.length).toBe(100 * 100 * 4);
    }
  });

  test('handles different image sizes', async () => {
    const smallImages = TestImages.small();
    const largeImages = TestImages.large();

    for (const asset of [...smallImages.slice(0, 2), ...largeImages.slice(0, 2)]) {
      const arrayBuffer = await asset.asArrayBuffer();
      const pixelData = await decode(arrayBuffer);

      expect(pixelData.width).toBeGreaterThan(0);
      expect(pixelData.height).toBeGreaterThan(0);
      expect(pixelData.data).toBeInstanceOf(Uint8ClampedArray);
    }
  });

  test('handles different formats', async () => {
    const formats = ['jpeg', 'png', 'webp'] as const;

    for (const format of formats) {
      const asset = TestImages.get('medium', format);
      const arrayBuffer = await asset.asArrayBuffer();
      const pixelData = await decode(arrayBuffer);

      expect(pixelData.width).toBeGreaterThan(0);
      expect(pixelData.height).toBeGreaterThan(0);
    }
  });
});
