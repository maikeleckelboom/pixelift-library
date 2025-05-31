import type { CommonOptions } from '@/types';
import type { SupportedFormat } from '@/shared/formats.ts';
import type { Pool } from '@/browser/decoders/canvas/pool/types.ts';

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
  pool?: Pool;
}
