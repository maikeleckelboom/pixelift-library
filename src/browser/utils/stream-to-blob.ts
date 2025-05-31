import type { StreamOptions } from '@/types';

export interface StreamToBlobOptions extends StreamOptions {
  type: string;
}

export async function streamToBlob(
  stream: ReadableStream<Uint8Array>,
  options: StreamToBlobOptions
): Promise<Blob> {
  const { type, onProgress, signal } = options;

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  try {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException('Stream reading was aborted', 'AbortError');
      }

      const { done, value } = await reader.read();
      if (done) break;

      if (value.byteLength > 0) {
        chunks.push(value);
        totalLength += value.byteLength;
        onProgress?.(totalLength);
      }
    }
  } finally {
    reader.releaseLock();
  }

  return new Blob(chunks, { type });
}
