import type { BrowserInput, BrowserOptions } from '@/browser/types.ts';
import {
  isBufferSource,
  isReadableStream,
  isResponse,
  isSVGElement
} from '@/browser/utils/type-checks.ts';
import { sanitizeSVGElement } from '@/browser/utils/sanitize-svg-element.ts';
import { streamToBlob } from '@/browser/utils/stream-to-blob.ts';

/**
 * Normalize various input types to a Blob.
 * @param input - SVG element, Response, BufferSource, or ReadableStream.
 * @param options - Options for the Blob, such as mimeType.
 */
export async function normalizeToBlob(
  input: Omit<BrowserInput, 'ImageBitmapSource'>,
  options: BrowserOptions
): Promise<Blob> {
  if (isSVGElement(input)) {
    return new Blob([sanitizeSVGElement(input)], { type: 'image/svg+xml' });
  }

  if (isResponse(input)) {
    return input.blob();
  }

  if (isBufferSource(input)) {
    return Promise.resolve(
      new Blob([input], { type: options?.mimeType ?? 'application/octet-stream' })
    );
  }

  if (isReadableStream(input)) {
    return streamToBlob(input, options);
  }

  throw new TypeError(`Unsupported input type for decoding ${typeof input}: ${input}`);
}
