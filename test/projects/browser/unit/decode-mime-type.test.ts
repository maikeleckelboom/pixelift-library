import { TestImages } from '@test/fixtures/images';
import { decode } from '@/browser';

describe('decoder in browser environment with MIME-type', () => {
  test('decodes image with MIME-type', async () => {
    const asset = TestImages.get('small', 'png');
    const mimeType = `image/${asset.format}` as const;
    const pixelData = await decode(await asset.asArrayBuffer(), { mimeType });

    expect(pixelData.width).toBeGreaterThan(0);
    expect(pixelData.height).toBeGreaterThan(0);
    expect(pixelData.data.length).toBe(pixelData.width * pixelData.height * 4);
  });
});
