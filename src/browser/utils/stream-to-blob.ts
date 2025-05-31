import type { ProgressController } from '@/types';
import { throwIfAborted } from '@/shared/abort.ts';

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
      throwIfAborted(signal, 'Aborted while reading stream to Blob');

      const { done, value } = await reader.read();
      if (done) break;

      if (value.byteLength > 0) {
        blobParts.push(value);
        totalLength += value.byteLength;
        onProgress?.(totalLength);

        // Recycle memory every 50 chunks
        if (blobParts.length > 50) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          const combined = new Blob(blobParts, { type });
          blobParts.length = 0;
          blobParts.push(combined);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return new Blob(blobParts, { type });
}
