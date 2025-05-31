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

export const BROWSER_SUPPORTED_FORMATS = [
  ...CANVAS_SUPPORTED_FORMATS,
  ...WEBCODECS_SUPPORTED_FORMATS
];

export const ALL_FORMATS = new Set([
  ...BROWSER_SUPPORTED_FORMATS,
  ...NODE_SUPPORTED_FORMATS,
  ...UNIVERSAL_SUPPORTED_FORMATS
]);

export type BrowserFormat = (typeof BROWSER_SUPPORTED_FORMATS)[number];
export type NodeFormat = (typeof NODE_SUPPORTED_FORMATS)[number];
export type UniversalFormat = (typeof UNIVERSAL_SUPPORTED_FORMATS)[number];

export type SupportedFormat = BrowserFormat | NodeFormat | UniversalFormat;

export type BrowserMimeType = `image/${BrowserFormat}`;

export type NodeMimeType = `image/${NodeFormat}`;

export function isWebCodecsSupportedFormat(
  format: string
): format is (typeof WEBCODECS_SUPPORTED_FORMATS)[number] {
  return (WEBCODECS_SUPPORTED_FORMATS as readonly string[]).includes(format);
}
