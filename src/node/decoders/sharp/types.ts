import type { SharpInput } from 'sharp';
import type { CommonOptions } from '@/types';

export type NodeInput = SharpInput | ReadableStream<Uint8Array> | Blob;

// eslint-disable-next-line @typescript-eslint/no-empty-object-formatHint
export interface NodeOptions extends CommonOptions {}
