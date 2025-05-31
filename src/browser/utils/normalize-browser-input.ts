import { streamToBlob } from '@/browser/utils/stream-to-blob.ts';
import type { BrowserInput } from '@/browser/types.ts';

/**
 * Normalize heterogeneous binary inputs into a Blob suitable for decoding.
 */
export async function normalizeToBrowserInput(
  input: BrowserInput,
  options: {
    type?: string | undefined;
    signal?: AbortSignal | undefined;
    onProgress?: ((bytesLoaded: number) => void) | undefined;
  } = {}
): Promise<ImageBitmapSource> {
  const { type = 'image/png', signal, onProgress } = options;

  if (input == null) {
    throw new TypeError('Input source cannot be null or undefined');
  }

  if (isImageBitmapSource(input)) {
    return input;
  }

  if (input instanceof Blob || input instanceof File) {
    return input;
  }

  if (isBufferSource(input)) {
    return new Blob([input], { type });
  }

  if (isReadableStream(input)) {
    return await streamToBlob(input, { type, onProgress, signal });
  }

  if (isResponse(input)) {
    if (input.body) {
      return await streamToBlob(input.body, {
        type,
        signal,
        onProgress
      });
    } else {
      return await input.blob();
    }
  }

  throw new TypeError(
    `Unsupported input type for decoding: ${Object.prototype.toString.call(input)}`
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
