import type { BrowserInput, ImageBufferSource } from '@/browser/types';
import {
  sanitizeSVGElement,
  svgToBufferSource
} from '@/browser/utils/sanitize-svg-element.ts';

export function isImageBufferSource(input: BrowserInput): input is ImageBufferSource {
  return (
    input instanceof ArrayBuffer ||
    ArrayBuffer.isView(input) ||
    input instanceof Response ||
    input instanceof Blob ||
    input instanceof ReadableStream ||
    input instanceof SVGElement
  );
}

/**
 * Converts various BrowserInput types into a BufferSource
 */
export async function toImageBufferSource(input: BrowserInput): Promise<ImageBufferSource> {
  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return input;
  }

  if (input instanceof Response) {
    return await input.arrayBuffer();
  }

  if (input instanceof Blob) {
    return await input.arrayBuffer();
  }

  if (input instanceof ReadableStream) {
    return input;
  }

  if (input instanceof SVGElement) {
    return svgToBufferSource(input);
  }

  // Fallthrough: assume ImageBitmapSource (e.g., HTMLImageElement)
  throw new TypeError(
    `Unsupported input type. You may need to pre-convert ImageBitmapSource (e.g., HTMLImageElement) to BufferSource.`
  );
}
