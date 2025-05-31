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
  jp2: { mime: 'image/jp2' },
  pdf: { mime: 'application/pdf' },
  raw: { mime: 'application/octet-stream' }
} as const;

const ENVIRONMENT_SUPPORT = {
  canvas: ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp', 'avif', 'ico', 'svg'],
  webcodecs: ['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif', 'bmp', 'ico'],
  node: ['jpeg', 'jpg', 'png', 'webp', 'gif', 'tiff', 'heif', 'jp2', 'pdf', 'raw', 'svg'],
  crossEnv: ['jpeg', 'jpg', 'png', 'webp', 'gif', 'svg']
} as const;

export const CANVAS_SUPPORTED_FORMATS = ENVIRONMENT_SUPPORT.canvas;
export const WEBCODECS_SUPPORTED_FORMATS = ENVIRONMENT_SUPPORT.webcodecs;
export const NODE_SUPPORTED_FORMATS = ENVIRONMENT_SUPPORT.node;
export const BROWSER_SUPPORTED_FORMATS = [
  ...new Set([...ENVIRONMENT_SUPPORT.canvas, ...ENVIRONMENT_SUPPORT.webcodecs])
] as const;

export type BrowserFormat = (typeof BROWSER_SUPPORTED_FORMATS)[number];
export type NodeFormat = (typeof NODE_SUPPORTED_FORMATS)[number];
export type WebCodecsFormat = (typeof WEBCODECS_SUPPORTED_FORMATS)[number];
export type SupportedFormat = BrowserFormat | NodeFormat;

export function validateBrowserFormat(format: string): format is BrowserFormat {
  return BROWSER_SUPPORTED_FORMATS.includes(format as BrowserFormat);
}

export function validateNodeFormat(format: string): format is NodeFormat {
  return NODE_SUPPORTED_FORMATS.includes(format as NodeFormat);
}

export function validateWebCodecsFormat(format: string): format is WebCodecsFormat {
  return WEBCODECS_SUPPORTED_FORMATS.includes(format as WebCodecsFormat);
}

export type FormatRegistry = typeof FORMAT_REGISTRY;

type MimeTypeOf<T extends keyof FormatRegistry> = FormatRegistry[T]['mime'];

export type BrowserMimeType = MimeTypeOf<BrowserFormat>;
export type NodeMimeType = MimeTypeOf<NodeFormat>;
export type WebCodecsMimeType = MimeTypeOf<WebCodecsFormat>;

export function getMimeTypeForFormat(
  format: BrowserFormat | NodeFormat | (string & {})
): string {
  if (format in FORMAT_REGISTRY) {
    return FORMAT_REGISTRY[format as keyof FormatRegistry].mime;
  }
  throw new TypeError(`Unsupported format: ${format}`);
}
