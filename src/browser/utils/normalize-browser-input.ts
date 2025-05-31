import { streamToBlob } from '@/browser/utils/stream-to-blob.ts';
import { serializeSVGElement } from '@/browser/utils/serialize-svg-element.ts';
import type { BrowserInput } from '@/browser/types.ts';
import { getMimeTypeForFormat, validateBrowserFormat } from '@/shared/formats.ts';

/**
 * Normalize heterogeneous binary inputs into a Blob suitable for decoding.
 */
export async function normalizeToBrowserInput(
  input: BrowserInput,
  options: {
    signal?: AbortSignal | undefined;
    onProgress?: ((progress: number) => void) | undefined;
    formatHint?: string;
  }
): Promise<ImageBitmapSource> {
  const { formatHint, signal, onProgress } = options;

  if (input == null) {
    throw new TypeError('Input source cannot be null or undefined');
  }

  if (isImageBitmapSource(input)) {
    return input;
  }

  if (input instanceof Blob) {
    return input;
  }

  const mimeType = getMimeTypeForFormat(formatHint ?? 'png');

  if (isBufferSource(input)) {
    return new Blob([input], { type: mimeType });
  }

  if (isReadableStream(input)) {
    return await streamToBlob(input, {
      type: getMimeTypeForFormat(mimeType),
      onProgress,
      signal
    });
  }

  if (isResponse(input)) {
    if (!formatHint) {
      const contentType = input.headers.get('content-type') ?? '';
      const [contentMimeType] = contentType.split(';') as [string, ...string[]];

      if (!validateBrowserFormat(contentMimeType)) {
        throw new TypeError(`Unsupported content type: ${contentMimeType}`);
      }
    }

    if (input.body) {
      return await streamToBlob(input.body, {
        type: mimeType,
        signal,
        onProgress
      });
    } else {
      return await input.blob();
    }
  }

  if (isSVGElement(input)) {
    const safeSVGString = serializeSVGElement(input);
    return new Blob([safeSVGString], { type: 'image/svg+xml' });
  }

  throw new TypeError(
    `Unsupported input type for decoding: ${Object.prototype.toString.call(input)}`
  );
}

export function isSVGElement(value: unknown): value is SVGElement {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ownerSVGElement' in value &&
    value instanceof SVGElement
  );
}

export function isBufferSource(value: unknown): value is BufferSource {
  return (
    value instanceof ArrayBuffer ||
    (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(value))
  );
}

export function isReadableStream(value: unknown): value is ReadableStream<Uint8Array> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'getReader' in value &&
    typeof value.getReader === 'function'
  );
}

export function isResponse(value: unknown): value is Response {
  return (
    typeof value === 'object' &&
    value !== null &&
    'body' in value &&
    value instanceof Response
  );
}

export function isImageBitmapSource(value: unknown): value is ImageBitmapSource {
  return (
    value instanceof ImageBitmap ||
    value instanceof HTMLImageElement ||
    value instanceof SVGImageElement ||
    value instanceof HTMLCanvasElement ||
    value instanceof ImageData ||
    value instanceof OffscreenCanvas ||
    value instanceof HTMLVideoElement ||
    value instanceof VideoFrame ||
    value instanceof Blob
  );
}
