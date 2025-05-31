import type { CommonOptions } from '@/types';

export type BrowserInput =
  | ImageBitmapSource
  | Uint8Array
  | BufferSource
  | Response
  | SVGElement
  | ReadableStream<Uint8Array>
  | null;

export interface BrowserOptions extends CommonOptions {
  quality?: ImageSmoothingQuality;
}
