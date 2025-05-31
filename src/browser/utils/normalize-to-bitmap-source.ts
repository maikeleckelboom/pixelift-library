import { streamToBlob } from '@/browser/utils/stream-to-blob.ts';
import { sanitizeSVGElement } from '@/browser/utils/sanitize-svg-element.ts';
import type { BrowserInput } from '@/browser/types.ts';
import { type BrowserFormat, getMimeTypeForFormat } from '@/shared/formats.ts';
import {
  isBufferSource,
  isImageBitmapSource,
  isReadableStream,
  isResponse,
  isSVGElement
} from '@/browser/utils/type-checks.ts';
import type { ProgressCallback } from '@/types';

/**
 * Normalize heterogeneous binary inputs into a Blob suitable for decoding.
 */
export async function normalizeToBitmapSource(
  input: BrowserInput,
  options: {
    signal?: AbortSignal | undefined;
    onProgress?: ProgressCallback | undefined;
    formatHint?: BrowserFormat | (string & {}) | undefined;
  }
): Promise<ImageBitmapSource> {
  const { formatHint, signal, onProgress } = options;

  if (input == null) {
    throw new TypeError('Input source cannot be null or undefined');
  }

  if (isImageBitmapSource(input)) {
    return input;
  }

  const mimeType = getMimeTypeForFormat(formatHint ?? 'png');

  if (isBufferSource(input)) {
    return handleBufferSource(input, mimeType);
  }

  if (isReadableStream(input)) {
    return handleReadableStream(input, mimeType, signal, onProgress);
  }

  if (isResponse(input)) {
    return handleResponse(input, formatHint);
  }

  if (isSVGElement(input)) {
    return handleSVGElement(input);
  }

  throw new TypeError(`Unsupported input type for decoding ${typeof input}: ${input}`);
}

async function handleBufferSource(input: BufferSource, mimeType: string): Promise<Blob> {
  return new Blob([input], { type: mimeType });
}

async function handleReadableStream(
  input: ReadableStream<Uint8Array>,
  mimeType: string,
  signal?: AbortSignal,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return streamToBlob(input, { type: mimeType, signal, onProgress });
}

async function handleResponse(response: Response, formatHint?: string): Promise<Blob> {
  const mimeType =
    formatHint ??
    response.headers.get('Content-Type')?.split(';')[0]?.trim() ??
    'application/octet-stream';
  return new Blob([await response.arrayBuffer()], { type: mimeType });
}

function handleSVGElement(input: SVGElement): Blob {
  const safeSVGString = sanitizeSVGElement(input);
  return new Blob([safeSVGString], { type: 'image/svg+xml' });
}
