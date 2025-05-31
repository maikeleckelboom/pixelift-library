import { streamToBlob } from '@/browser/utils/stream-to-blob.ts';
import { serializeSVGElement } from '@/browser/utils/serialize-svg-element.ts';
import type { BrowserInput } from '@/browser/types.ts';
import {
  type BrowserFormat,
  getMimeTypeForFormat,
  validateBrowserFormat
} from '@/shared/formats.ts';
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
    return handleResponse(input, mimeType, formatHint, signal, onProgress);
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

async function handleResponse(
  input: Response,
  mimeType: string,
  formatHint?: string,
  signal?: AbortSignal,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (!formatHint) {
    const contentType = input.headers.get('content-type') ?? '';
    const [contentMimeType] = contentType.split(';') as [string, ...string[]];
    if (!validateBrowserFormat(contentMimeType)) {
      throw new TypeError(`Unsupported content type: ${contentType}`);
    }
  }

  return input.body
    ? streamToBlob(input.body, { type: mimeType, signal, onProgress })
    : input.blob();
}

function handleSVGElement(input: SVGElement): Blob {
  const safeSVGString = serializeSVGElement(input);
  return new Blob([safeSVGString], { type: 'image/svg+xml' });
}
