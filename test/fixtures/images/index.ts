export type ImageFormat = 'jpeg' | 'jpg' | 'png' | 'gif' | 'webp';
export type ImageSize = 'small' | 'medium' | 'large';

export interface ImageAsset {
  readonly id: string;
  readonly size: ImageSize;
  readonly format: ImageFormat;
  readonly name: string;

  asBlob(): Promise<Blob>;

  asArrayBuffer(): Promise<ArrayBuffer>;

  asDataURL(): Promise<string>;

  asBase64(): Promise<string>;

  asBuffer(): Promise<Buffer>;
}

const ASSETS = [
  ...['jpeg', 'jpg', 'png', 'gif', 'webp'].map((format) => ({
    size: 'small' as ImageSize,
    format: format as ImageFormat,
    name: 'pixelift'
  })),
  ...['jpeg', 'jpg', 'png', 'gif', 'webp'].map((format) => ({
    size: 'medium' as ImageSize,
    format: format as ImageFormat,
    name: 'pixelift'
  })),
  ...['jpeg', 'jpg', 'png', 'gif', 'webp'].map((format) => ({
    size: 'large' as ImageSize,
    format: format as ImageFormat,
    name: 'pixelift'
  }))
];

const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const createImageAsset = (config: {
  size: ImageSize;
  format: ImageFormat;
  name: string;
}): ImageAsset => {
  const { size, format, name } = config;
  const id = `${size}-${format}-${name}`;

  const baseAsset = {
    id,
    size,
    format,
    name
  };

  if (isBrowser) {
    const url = `/test/fixtures/images/${size}/${name}.${format}`;

    const fetchAsset = async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load ${id}: ${response.statusText}`);
      return response;
    };

    return {
      ...baseAsset,
      async asBlob() {
        return (await fetchAsset()).blob();
      },
      async asArrayBuffer() {
        return (await fetchAsset()).arrayBuffer();
      },
      async asDataURL() {
        const blob = await this.asBlob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      },
      async asBase64() {
        const dataURL = await this.asDataURL();
        return dataURL.split(',')[1]!;
      },
      async asBuffer() {
        const response = await fetchAsset();
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    };
  }

  const getMimeType = () =>
    ({
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp'
    })[format];

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const filePath = require('path').resolve(
    `./test/fixtures/images/${size}/${name}.${format}`
  );

  return {
    ...baseAsset,
    async asBlob() {
      const buffer = await this.asArrayBuffer();
      return new Blob([buffer], { type: getMimeType() });
    },
    async asArrayBuffer() {
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(filePath);
      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      ) as ArrayBuffer;
    },
    async asDataURL() {
      const base64 = await this.asBase64();
      return `data:${getMimeType()};base64,${base64}`;
    },
    async asBase64() {
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(filePath);
      return buffer.toString('base64');
    },
    async asBuffer() {
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(filePath);
      return buffer;
    }
  };
};

export const TestImageRegistry = {
  getAll: () => ASSETS.map(createImageAsset),
  getBySize: (size: ImageSize) =>
    ASSETS.filter((a) => a.size === size).map(createImageAsset),
  getByFormat: (format: ImageFormat) =>
    ASSETS.filter((a) => a.format === format).map(createImageAsset),
  get: (size: ImageSize, format: ImageFormat, name = 'pixelift') => {
    const asset = ASSETS.find(
      (a) => a.size === size && a.format === format && a.name === name
    );
    if (!asset) throw new Error(`No asset found for ${size}/${format}/${name}`);
    return createImageAsset(asset);
  }
};

export const TestImages = {
  all: () => TestImageRegistry.getAll(),
  small: () => TestImageRegistry.getBySize('small'),
  medium: () => TestImageRegistry.getBySize('medium'),
  large: () => TestImageRegistry.getBySize('large'),
  jpeg: () => TestImageRegistry.getByFormat('jpeg'),
  png: () => TestImageRegistry.getByFormat('png'),
  gif: () => TestImageRegistry.getByFormat('gif'),
  webp: () => TestImageRegistry.getByFormat('webp'),
  get: (size: ImageSize, format: ImageFormat) => TestImageRegistry.get(size, format),
  oneOfEach: () => [
    TestImageRegistry.get('small', 'jpeg'),
    TestImageRegistry.get('medium', 'png'),
    TestImageRegistry.get('large', 'webp')
  ],
  stress: () => TestImageRegistry.getAll()
};
