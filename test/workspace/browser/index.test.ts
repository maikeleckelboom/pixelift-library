import { decode } from '@/index';
import { getTestCases, loadBlob } from '@test/fixtures/images';

describe('decoder in browser environment', () => {
  const testCases = getTestCases();

  test.each(testCases)(
    'decodes $size $format image correctly',
    async ({ loader }) => {
      if (!loader) {
        throw new Error('TestImageLoader is undefined, skipping test');
      }
      const blob = await loadBlob(loader);
      const pixelData = await decode(blob);

      expect(pixelData.width).toBeGreaterThan(0);
      expect(pixelData.height).toBeGreaterThan(0);
      expect(pixelData.data.length).toBe(pixelData.width * pixelData.height * 4);
    },
    60_000
  );

  test('decodes with resizing across all formats and sizes', async () => {
    const resize = { width: 20, height: 20, fit: 'cover' as const };

    for (const { loader } of testCases) {
      const blob = await loadBlob(loader);
      const pixelData = await decode(blob, { resize });

      expect(pixelData.width).toBe(resize.width);
      expect(pixelData.height).toBe(resize.height);
      expect(pixelData.data.length).toBe(resize.width * resize.height * 4);
    }
  });
});
