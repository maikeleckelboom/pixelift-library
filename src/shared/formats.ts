/*
const FORMAT_REGISTRY = {
  jpeg: { mime: 'image/jpeg' },
  jpg: { mime: 'image/jpeg' },
  png: { mime: 'image/png' },
  webp: { mime: 'image/webp' },
  gif: { mime: 'image/gif' },
  bmp: { mime: 'image/bmp' },
  avif: { mime: 'image/avif' },
  ico: { mime: 'image/x-icon' },
  svg: { mime: 'image/svg+xml' },
  tiff: { mime: 'image/tiff' },
  heif: { mime: 'image/heic' },
  heic: { mime: 'image/heic' },
  'heif-sequence': { mime: 'image/heic-sequence' },
  'heic-sequence': { mime: 'image/heic-sequence' },
  jp2: { mime: 'image/jp2' },
  jxl: { mime: 'image/jxl' }
} as const;

const ENVIRONMENT_SUPPORT = {
  canvas: ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp', 'avif', 'ico', 'svg'],
  webcodecs: ['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif', 'bmp', 'ico'],
  node: ['jpeg', 'jpg', 'png', 'webp', 'gif', 'tiff', 'heif', 'heic', 'jp2', 'pdf', 'svg']
} as const;

// export const CANVAS_SUPPORTED_FORMATS = ENVIRONMENT_SUPPORT.canvas;
export const WEBCODECS_SUPPORTED_FORMATS = ENVIRONMENT_SUPPORT.webcodecs;
export const NODE_SUPPORTED_FORMATS = ENVIRONMENT_SUPPORT.node;
export const BROWSER_SUPPORTED_FORMATS = [
  ...new Set([...ENVIRONMENT_SUPPORT.canvas, ...ENVIRONMENT_SUPPORT.webcodecs])
] as const;

export type BrowserFormat = (typeof BROWSER_SUPPORTED_FORMATS)[number];
export type NodeFormat = (typeof NODE_SUPPORTED_FORMATS)[number];
export type WebCodecsFormat = (typeof WEBCODECS_SUPPORTED_FORMATS)[number];
export type FormatHint = BrowserFormat | NodeFormat | WebCodecsFormat;

export type FormatRegistry = typeof FORMAT_REGISTRY;

export function getMimeTypeFromFormatHint<T extends keyof FormatRegistry>(
  format: T | undefined
): FormatRegistry[T]['mime'] {
  if (format && format in FORMAT_REGISTRY) {
    return FORMAT_REGISTRY[format].mime;
  }
  throw new TypeError(`Unsupported format: ${format}`);
}
*/
