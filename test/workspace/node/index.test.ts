import { getTestCases, loadArrayBuffer } from '@test/fixtures/images';
import { decode } from '@/node';
import { NODE_SUPPORTED_FORMATS } from '@/shared/formats';

describe('decoder in node environment', () => {
  const testCases = getTestCases().filter(({ format }) =>
    NODE_SUPPORTED_FORMATS.includes(format)
  );

  test.each(testCases)('decodes $size $format image correctly', async ({ loader }) => {
    const arrayBuffer = await loadArrayBuffer(loader);
    const pixelData = await decode(arrayBuffer);

    expect(pixelData.width).toBeGreaterThan(0);
    expect(pixelData.height).toBeGreaterThan(0);
    expect(pixelData.data.length).toBe(pixelData.width * pixelData.height * 4);
  });

  test('decodes with resizing', async () => {
    for (const { loader } of testCases) {
      const arrayBuffer = await loadArrayBuffer(loader);
      const pixelData = await decode(arrayBuffer, {
        resize: { width: 100, height: 100, fit: 'cover' }
      });

      expect(pixelData.width).toBe(100);
      expect(pixelData.height).toBe(100);
      expect(pixelData.data.length).toBe(100 * 100 * 4);
    }
  });
});
