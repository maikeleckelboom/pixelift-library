import type { ProgressOptions } from '@/types';

export async function webStreamToBuffer(
  stream: ReadableStream<Uint8Array>,
  options?: ProgressOptions
): Promise<Buffer> {
  const { onProgress, signal } = options ?? {};

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  if (signal?.aborted) {
    reader.releaseLock();
    throw new DOMException('Stream reading was aborted', 'AbortError');
  }

  const abortPromise = new Promise<never>((_, reject) => {
    if (!signal) return;
    const onAbort = () => {
      reader.cancel().catch(() => {});
      reject(new DOMException('Stream reading was aborted', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });

  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), abortPromise]);

      if (done) break;
      if (value) {
        chunks.push(value);
        totalLength += value.byteLength;
        onProgress?.(totalLength);
      }
    }
  } finally {
    reader.releaseLock();
  }

  const combined = Buffer.allocUnsafe(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  return combined;
}
