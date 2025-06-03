export interface StreamOptions {
  onProgress?: (loadedBytes: number) => void;
  chunkSize?: number;
  yieldEvery?: number;
  maxBytes?: number;
  mimeType?: string;
  signal?: AbortSignal;
}

export async function streamToBlob(
  stream: ReadableStream<Uint8Array>,
  options?: StreamOptions
): Promise<Blob> {
  const {
    mimeType,
    onProgress,
    signal,
    chunkSize: inputChunkSize = 64 * 1024,
    yieldEvery: inputYieldEvery = 50,
    maxBytes = Infinity
  } = options ?? {};

  const chunkSize = Math.max(1, inputChunkSize);
  const yieldEvery = Math.max(1, inputYieldEvery);

  const reader = stream.getReader();
  const blobParts: BlobPart[] = [];
  const pendingChunks: Uint8Array[] = [];

  let totalLength = 0;
  let pendingSize = 0;
  let chunkCount = 0;

  const processPending = async () => {
    while (pendingSize >= chunkSize) {
      signal?.throwIfAborted?.();

      const chunk = new Uint8Array(chunkSize);
      let filled = 0;

      while (filled < chunkSize) {
        const current = pendingChunks[0];
        if (!current) break;

        const toCopy = Math.min(chunkSize - filled, current.length);
        chunk.set(current.subarray(0, toCopy), filled);
        filled += toCopy;

        if (toCopy === current.length) {
          pendingChunks.shift();
        } else {
          pendingChunks[0] = current.subarray(toCopy);
        }

        pendingSize -= toCopy;
      }

      blobParts.push(chunk);
      chunkCount++;

      if (chunkCount % yieldEvery === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  };

  try {
    while (true) {
      signal?.throwIfAborted?.();

      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.length) continue;

      const remaining = maxBytes - totalLength;
      if (remaining <= 0) break;

      const chunk = remaining < value.length ? value.subarray(0, remaining) : value;

      pendingChunks.push(chunk);
      pendingSize += chunk.length;
      totalLength += chunk.length;
      onProgress?.(totalLength);

      await processPending();

      if (totalLength >= maxBytes) break;
    }

    await processPending();

    if (pendingSize > 0) {
      const combined = new Uint8Array(pendingSize);
      let offset = 0;
      for (const chunk of pendingChunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      blobParts.push(combined);
    }
  } finally {
    reader.releaseLock();
  }

  return new Blob(blobParts, { type: mimeType ?? 'application/octet-stream' });
}
