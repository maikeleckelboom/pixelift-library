export function isSVGElement(value: unknown): value is SVGElement {
  return value instanceof SVGElement;
}

export function isBufferSource(value: unknown): value is BufferSource {
  return value instanceof ArrayBuffer || ArrayBuffer.isView(value);
}

export function isReadableStream(value: unknown): value is ReadableStream<Uint8Array> {
  return value instanceof ReadableStream;
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
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
