import { isBrowser } from '@/shared';

export type TestImageFormat = 'jpeg' | 'jpg' | 'png' | 'gif' | 'webp';
export type TestImageLoader = () => Promise<Response>;

export interface TestImageGroups {
  small: Record<TestImageFormat, TestImageLoader>;
  medium: Record<TestImageFormat, TestImageLoader>;
  large: Record<TestImageFormat, TestImageLoader>;
}

// List all formats and the base filename (pixelift).
const formats: { key: TestImageFormat; ext: string; name: string }[] = [
  { key: 'jpeg', ext: 'jpeg', name: 'pixelift' },
  { key: 'jpg', ext: 'jpg', name: 'pixelift' },
  { key: 'png', ext: 'png', name: 'pixelift' },
  { key: 'gif', ext: 'gif', name: 'pixelift' },
  { key: 'webp', ext: 'webp', name: 'pixelift' }
];

/**
 * From within fixtures/images/index.ts, we want to point at:
 *   └─ fixtures/images/{size}/{name}.{ext}
 *
 * In Node:   new URL(`./${size}/${name}.${ext}`, import.meta.url)  → file://…/fixtures/images/…
 * In Browser: new URL(`./${size}/${name}.${ext}`, import.meta.url)  → http://…/assets/… (bundler rewrites it)
 */
const createImageRecord = (size: string): Record<TestImageFormat, TestImageLoader> => {
  return formats.reduce(
    (record, { key, ext, name }) => {
      // Relative path from this file (fixtures/images/index.ts) to e.g. fixtures/images/small/pixelift.png
      const relativePath = `./${size}/${name}.${ext}`;

      let urlString: string;
      if (isBrowser()) {
        // Let the bundler (Vite/webpack) rewrite new URL(...) into the correct served HTTP path.
        urlString = new URL(relativePath, import.meta.url).href;
      } else {
        // In Node ≥ v18, global fetch can load file:// URLs directly
        urlString = new URL(relativePath, import.meta.url).href;
        // That href will look like: file:///…/fixtures/images/small/pixelift.png
      }

      record[key] = () => fetch(urlString);
      return record;
    },
    {} as Record<TestImageFormat, TestImageLoader>
  );
};

export const testImageGroups: TestImageGroups = {
  small: createImageRecord('small'),
  medium: createImageRecord('medium'),
  large: createImageRecord('large')
};

export interface TestCase {
  size: keyof TestImageGroups;
  format: TestImageFormat;
  loader: TestImageLoader;
}

export function getTestCases(): TestCase[] {
  return (Object.keys(testImageGroups) as (keyof TestImageGroups)[]).flatMap((size) => {
    const formatLoaders = testImageGroups[size];
    return (Object.entries(formatLoaders) as [TestImageFormat, TestImageLoader][]).map(
      ([format, loader]) => ({ size, format, loader })
    );
  });
}

export async function loadBlob(loader: TestImageLoader): Promise<Blob> {
  const response = await loader();
  return response.blob();
}

export async function loadArrayBuffer(
  loader: TestImageLoader
): Promise<ArrayBuffer | Buffer> {
  const response = await loader();
  return response.arrayBuffer();
}
