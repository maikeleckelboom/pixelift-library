import type { SharpInput } from 'sharp';
import type { CommonOptions } from '@/types';

export type NodeInput = SharpInput | ReadableStream<Uint8Array> | Blob;

export interface NodeOptions extends CommonOptions {
  type?: string;
}
