import { Readable } from 'stream';
import type { ProgressController } from '@/types';

export async function nodeStreamToBuffer(
  stream: Readable,
  options?: ProgressController
): Promise<Buffer> {
  const { onProgress, signal } = options ?? {};

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalLength = 0;

    if (signal?.aborted) {
      return reject(new DOMException('Stream reading was aborted', 'AbortError'));
    }

    const onAbort = () => {
      reject(new DOMException('Stream reading was aborted', 'AbortError'));
      cleanup();
    };

    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort);
      stream.removeListener('data', onData);
      stream.removeListener('end', onEnd);
      stream.removeListener('error', onError);
    };

    const onData = (chunk: Buffer) => {
      chunks.push(chunk);
      totalLength += chunk.length;
      onProgress?.(totalLength);
    };

    const onEnd = () => {
      cleanup();
      resolve(Buffer.concat(chunks, totalLength));
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    stream.on('data', onData);
    stream.on('end', onEnd);
    stream.on('error', onError);

    signal?.addEventListener('abort', onAbort);
  });
}
