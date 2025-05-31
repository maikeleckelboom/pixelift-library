import type { ProgressController } from '@/types';

export interface StreamToBlobOptions extends ProgressController {
  type: string;
}

export async function streamToBlob(
  stream: ReadableStream<Uint8Array>,
  options: StreamToBlobOptions
): Promise<Blob> {
  const { type, onProgress, signal } = options;
  const reader = stream.getReader();
  const blobParts: BlobPart[] = [];
  let totalLength = 0;

  try {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException('Stream reading was aborted', 'AbortError');
      }

      const { done, value } = await reader.read();
      if (done) break;

      if (value.byteLength > 0) {
        blobParts.push(value);
        totalLength += value.byteLength;
        onProgress?.(totalLength);

        // Allow event loop processing every 50 chunks
        if (blobParts.length % 50 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return new Blob(blobParts, { type });
}
