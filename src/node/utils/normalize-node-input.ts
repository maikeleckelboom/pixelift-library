import { nodeStreamToBuffer } from '@/node/utils/node-stream-to-buffer.ts';
import { webStreamToBuffer } from '@/node/utils/web-stream-to-buffer.ts';
import type { SharpInput } from 'sharp';
import { Readable } from 'stream';
import type { NodeInput, NodeOptions } from '@/node/types.ts';

export async function normalizeNodeInput(
  input: NodeInput,
  options?: NodeOptions
): Promise<SharpInput> {
  if (input == null) {
    throw new TypeError('Input source cannot be null or undefined');
  }
  if (isBlob(input)) {
    return await blobToBuffer(input);
  }
  if (isWebStream(input)) {
    return await webStreamToBuffer(input, options);
  }
  if (isNodeStream(input)) {
    return await nodeStreamToBuffer(input, options);
  }
  return input;
}

function isBlob(input: unknown): input is Blob {
  return input instanceof Blob;
}

async function blobToBuffer(blob: Blob): Promise<Buffer> {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function isWebStream(input: unknown): input is ReadableStream<Uint8Array> {
  return typeof ReadableStream !== 'undefined' && input instanceof ReadableStream;
}

function isNodeStream(input: unknown): input is Readable {
  return (
    typeof input === 'object' &&
    input !== null &&
    typeof (input as { pipe?: unknown }).pipe === 'function'
  );
}
