// Core types
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
}

// Asset registry - single source of truth
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TestImageRegistry {
  private static readonly ASSETS: Array<{
    size: ImageSize;
    format: ImageFormat;
    name: string;
  }> = [
    // Small images
    { size: 'small', format: 'jpeg', name: 'pixelift' },
    { size: 'small', format: 'jpg', name: 'pixelift' },
    { size: 'small', format: 'png', name: 'pixelift' },
    { size: 'small', format: 'gif', name: 'pixelift' },
    { size: 'small', format: 'webp', name: 'pixelift' },
    // Medium images
    { size: 'medium', format: 'jpeg', name: 'pixelift' },
    { size: 'medium', format: 'jpg', name: 'pixelift' },
    { size: 'medium', format: 'png', name: 'pixelift' },
    { size: 'medium', format: 'gif', name: 'pixelift' },
    { size: 'medium', format: 'webp', name: 'pixelift' },
    // Large images
    { size: 'large', format: 'jpeg', name: 'pixelift' },
    { size: 'large', format: 'jpg', name: 'pixelift' },
    { size: 'large', format: 'png', name: 'pixelift' },
    { size: 'large', format: 'gif', name: 'pixelift' },
    { size: 'large', format: 'webp', name: 'pixelift' }
  ];

  static getAll(): ImageAsset[] {
    return this.ASSETS.map((asset) => this.createAsset(asset));
  }

  static getBySize(size: ImageSize): ImageAsset[] {
    return this.ASSETS.filter((asset) => asset.size === size).map((asset) =>
      this.createAsset(asset)
    );
  }

  static getByFormat(format: ImageFormat): ImageAsset[] {
    return this.ASSETS.filter((asset) => asset.format === format).map((asset) =>
      this.createAsset(asset)
    );
  }

  static get(size: ImageSize, format: ImageFormat, name = 'pixelift'): ImageAsset {
    const config = this.ASSETS.find(
      (asset) => asset.size === size && asset.format === format && asset.name === name
    );

    if (!config) {
      throw new Error(`No asset found for ${size}/${format}/${name}`);
    }

    return this.createAsset(config);
  }

  private static createAsset(config: {
    size: ImageSize;
    format: ImageFormat;
    name: string;
  }): ImageAsset {
    const isBrowser =
      typeof window !== 'undefined' && typeof window.document !== 'undefined';

    if (isBrowser) {
      return new BrowserImageAsset(config.size, config.format, config.name);
    } else {
      return new NodeImageAsset(config.size, config.format, config.name);
    }
  }
}

// Browser implementation
class BrowserImageAsset implements ImageAsset {
  readonly id: string;
  private readonly url: string;

  constructor(
    readonly size: ImageSize,
    readonly format: ImageFormat,
    readonly name: string
  ) {
    this.id = `${size}-${format}-${name}`;
    this.url = `/test/fixtures/images/${size}/${name}.${format}`;
  }

  async asBlob(): Promise<Blob> {
    const response = await fetch(this.url);
    if (!response.ok) throw new Error(`Failed to load ${this.id}: ${response.statusText}`);
    return response.blob();
  }

  async asArrayBuffer(): Promise<ArrayBuffer> {
    const response = await fetch(this.url);
    if (!response.ok) throw new Error(`Failed to load ${this.id}: ${response.statusText}`);
    return response.arrayBuffer();
  }

  async asDataURL(): Promise<string> {
    const blob = await this.asBlob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async asBase64(): Promise<string> {
    const dataURL = await this.asDataURL();
    return dataURL.split(',')[1]!;
  }
}

// Node.js implementation
class NodeImageAsset implements ImageAsset {
  readonly id: string;
  private readonly filePath: string;

  constructor(
    readonly size: ImageSize,
    readonly format: ImageFormat,
    readonly name: string
  ) {
    this.id = `${size}-${format}-${name}`;

    // Use dynamic import to avoid bundling issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    this.filePath = path.resolve(`./test/fixtures/images/${size}/${name}.${format}`);
  }

  async asBlob(): Promise<Blob> {
    const buffer = await this.asArrayBuffer();
    const mimeType = this.getMimeType();
    return new Blob([buffer], { type: mimeType });
  }

  async asArrayBuffer(): Promise<ArrayBuffer> {
    const fs = await import('fs/promises');
    const buffer = await fs.readFile(this.filePath);
    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;
  }

  async asDataURL(): Promise<string> {
    const base64 = await this.asBase64();
    const mimeType = this.getMimeType();
    return `data:${mimeType};base64,${base64}`;
  }

  async asBase64(): Promise<string> {
    const fs = await import('fs/promises');
    const buffer = await fs.readFile(this.filePath);
    return buffer.toString('base64');
  }

  private getMimeType(): string {
    const mimeMap: Record<ImageFormat, string> = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp'
    };
    return mimeMap[this.format];
  }
}

// Utility functions for common test patterns
export const TestImages = {
  // Get all assets
  all: () => TestImageRegistry.getAll(),

  // Get by size
  small: () => TestImageRegistry.getBySize('small'),
  medium: () => TestImageRegistry.getBySize('medium'),
  large: () => TestImageRegistry.getBySize('large'),

  // Get by format
  jpeg: () => TestImageRegistry.getByFormat('jpeg'),
  png: () => TestImageRegistry.getByFormat('png'),
  gif: () => TestImageRegistry.getByFormat('gif'),
  webp: () => TestImageRegistry.getByFormat('webp'),

  // Get specific asset
  get: (size: ImageSize, format: ImageFormat) => TestImageRegistry.get(size, format),

  // Common test patterns
  oneOfEach: () => [
    TestImageRegistry.get('small', 'jpeg'),
    TestImageRegistry.get('medium', 'png'),
    TestImageRegistry.get('large', 'webp')
  ],

  // Performance testing
  stress: () => TestImageRegistry.getAll()
};

// Example usage patterns:
/*
// Simple usage
const smallJpeg = TestImages.get('small', 'jpeg');
const blob = await smallJpeg.asBlob();
const arrayBuffer = await smallJpeg.asArrayBuffer();

// Test all formats
for (const asset of TestImages.all()) {
  console.log(`Testing ${asset.id}`);
  const data = await asset.asArrayBuffer();
  // ... run tests
}

// Test specific sizes
for (const asset of TestImages.large()) {
  // ... test large images
}

// Get data in different formats
const asset = TestImages.get('medium', 'png');
const blob = await asset.asBlob();
const base64 = await asset.asBase64();
const dataURL = await asset.asDataURL();
*/
