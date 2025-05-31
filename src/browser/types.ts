import type { CommonOptions } from '@/types';
import type { SupportedFormat } from '@/shared/formats.ts';

export type BrowserInput =
  | ImageBitmapSource
  | Uint8Array
  | BufferSource
  | Response
  | SVGElement
  | ReadableStream<Uint8Array>
  | null;

export interface BrowserOptions extends CommonOptions {
  formatHint?: SupportedFormat;
  quality?: ImageSmoothingQuality;
}
