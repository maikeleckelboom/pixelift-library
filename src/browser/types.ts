export type ImageBufferSource = BufferSource | ReadableStream<Uint8Array>;

export type BrowserInput = ImageBitmapSource | ImageBufferSource | SVGElement | Response;

export interface ImageDecodeOptions {
  completeFramesOnly?: boolean;
  frameIndex?: number;
}

export type FitMode = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: FitMode;
}

export type MimeType = `${string}/${string}`;

export interface BrowserOptions extends ImageDecodeOptions {
  mimeType?: MimeType;
  signal?: AbortSignal;
  resize?: ResizeOptions;
  quality?: ImageSmoothingQuality;
}
