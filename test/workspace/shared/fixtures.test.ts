import { TestImages } from '@test/fixtures/images';

describe('fixtures registry', () => {
  test('registry provides correct asset metadata', () => {
    const allAssets = TestImages.all();

    expect(allAssets.length).toBeGreaterThan(0);

    for (const asset of allAssets) {
      expect(asset.id).toBeTruthy();
      expect(['small', 'medium', 'large']).toContain(asset.size);
      expect(['jpeg', 'jpg', 'png', 'gif', 'webp']).toContain(asset.format);
      expect(asset.name).toBe('pixelift');
    }
  });

  test('can filter assets by size', () => {
    const smallAssets = TestImages.small();
    const mediumAssets = TestImages.medium();
    const largeAssets = TestImages.large();

    expect(smallAssets.every((a) => a.size === 'small')).toBe(true);
    expect(mediumAssets.every((a) => a.size === 'medium')).toBe(true);
    expect(largeAssets.every((a) => a.size === 'large')).toBe(true);
  });

  test('can filter assets by format', () => {
    const pngAssets = TestImages.png();
    const jpegAssets = TestImages.jpeg();

    expect(pngAssets.every((a) => a.format === 'png')).toBe(true);
    expect(jpegAssets.every((a) => a.format === 'jpeg')).toBe(true);
  });

  test('can get specific assets', () => {
    const asset = TestImages.get('large', 'webp');

    expect(asset.size).toBe('large');
    expect(asset.format).toBe('webp');
    expect(asset.name).toBe('pixelift');
  });

  test('asset provides multiple data formats', async () => {
    const asset = TestImages.get('small', 'png');

    // All methods should work
    const blob = await asset.asBlob();
    const arrayBuffer = await asset.asArrayBuffer();
    const base64 = await asset.asBase64();
    const dataURL = await asset.asDataURL();

    expect(blob).toBeInstanceOf(Blob);
    expect(arrayBuffer).toBeInstanceOf(ArrayBuffer);
    expect(typeof base64).toBe('string');
    expect(typeof dataURL).toBe('string');
    expect(dataURL.startsWith('data:image/')).toBe(true);
  });
});
