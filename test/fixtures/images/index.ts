export type TestImageFormat = 'jpeg' | 'jpg' | 'png' | 'gif' | 'webp';

export type TestImageLoader = () => Promise<Response>;

export interface TestImageGroups {
  small: Record<TestImageFormat, TestImageLoader>;
  medium: Record<TestImageFormat, TestImageLoader>;
  large: Record<TestImageFormat, TestImageLoader>;
}

const createImageRecord = (size: string): Record<TestImageFormat, TestImageLoader> => {
  const formats: { key: TestImageFormat; ext: string; name: string }[] = [
    { key: 'jpeg', ext: 'jpeg', name: 'pixelift' },
    { key: 'jpg', ext: 'jpg', name: 'pixelift' },
    { key: 'png', ext: 'png', name: 'pixelift' },
    { key: 'gif', ext: 'gif', name: 'pixelift' },
    { key: 'webp', ext: 'webp', name: 'pixelift' }
  ];

  return formats.reduce(
    (record, { key, ext, name }) => {
      record[key] = () => fetch(new URL(`./${size}/${name}.${ext}`, import.meta.url));
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
    const formatLoaders = testImageGroups[size] as Record<
      TestImageFormat,
      TestImageLoader | undefined
    >;
    return Object.entries(formatLoaders)
      .filter(([, loader]) => loader)
      .map(([format, loader]) => ({
        size,
        format: format as TestImageFormat,
        loader: loader as TestImageLoader
      }));
  });
}

export interface TestImageLoaders {
  response: () => Promise<Response>;
  blob: () => Promise<Blob>;
  arrayBuffer: () => Promise<ArrayBuffer>;
  stream: () => Promise<ReadableStream<Uint8Array> | null>;
}

export async function loadBlob(loader: TestImageLoader): Promise<Blob> {
  const response = await loader();
  return response.blob();
}

export async function loadArrayBuffer(loader: TestImageLoader): Promise<ArrayBuffer> {
  const response = await loader();
  return response.arrayBuffer();
}

export async function loadStream(
  loader: TestImageLoader
): Promise<ReadableStream<Uint8Array> | null> {
  const response = await loader();
  return response.body;
}

export async function loadResponse(loader: TestImageLoader): Promise<Response> {
  return await loader();
}
