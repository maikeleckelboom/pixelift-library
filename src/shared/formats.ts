export const CANVAS_SUPPORTED_FORMATS = [
  'jpeg',
  'jpg',
  'png',
  'webp',
  'gif',
  'bmp',
  'avif',
  'ico',
  'svg'
] as const;

export const WEBCODECS_SUPPORTED_FORMATS = [
  'jpeg',
  'jpg',
  'png',
  'webp',
  'gif',
  'avif',
  'bmp',
  'ico'
] as const;

export const NODE_SUPPORTED_FORMATS = [
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
  ...CANVAS_SUPPORTED_FORMATS,
  ...WEBCODECS_SUPPORTED_FORMATS,
  ...NODE_SUPPORTED_FORMATS,
  ...UNIVERSAL_SUPPORTED_FORMATS
]);

export type SupportedFormat =
  | (typeof CANVAS_SUPPORTED_FORMATS)[number]
  | (typeof NODE_SUPPORTED_FORMATS)[number]
  | (typeof UNIVERSAL_SUPPORTED_FORMATS)[number];

export type UniversalFormat = (typeof UNIVERSAL_SUPPORTED_FORMATS)[number];

export function isUniversalFormat(format: string): format is UniversalFormat {
  return UNIVERSAL_SUPPORTED_FORMATS.includes(format as UniversalFormat);
}

export function isWebCodecsSupportedFormat(
  format: string
): format is (typeof WEBCODECS_SUPPORTED_FORMATS)[number] {
  return (WEBCODECS_SUPPORTED_FORMATS as readonly string[]).includes(format);
}
