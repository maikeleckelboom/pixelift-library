export const BROWSER_SUPPORTED_FORMATS = [
  'jpeg',
  'jpg',
  'png',
  'webp',
  'gif',
  'bmp',
  'svg',
  'avif'
] as const;

export const NODE_SUPPORTED_FORMATS_STATIC = [
  'jpeg',
  'jpg',
  'png',
  'webp',
  'gif',
  'tiff',
  'heif',
  'jp2',
  'pdf',
  'raw',
  'svg'
] as const;

export const UNIVERSAL_SUPPORTED_FORMATS = [
  'jpeg',
  'jpg',
  'png',
  'webp',
  'gif',
  'svg'
] as const;

export const ALL_FORMATS = new Set([
  ...BROWSER_SUPPORTED_FORMATS,
  ...NODE_SUPPORTED_FORMATS_STATIC,
  ...UNIVERSAL_SUPPORTED_FORMATS
]);

export type SupportedFormat =
  | (typeof BROWSER_SUPPORTED_FORMATS)[number]
  | (typeof NODE_SUPPORTED_FORMATS_STATIC)[number]
  | (typeof UNIVERSAL_SUPPORTED_FORMATS)[number];

export type UniversalFormat = (typeof UNIVERSAL_SUPPORTED_FORMATS)[number];

export function isUniversalFormat(format: string): format is UniversalFormat {
  return UNIVERSAL_SUPPORTED_FORMATS.includes(format as UniversalFormat);
}

export function getRuntimeBrowserFormats(): SupportedFormat[] {
  return [...BROWSER_SUPPORTED_FORMATS];
}
