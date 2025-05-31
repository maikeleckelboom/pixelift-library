import type { SharpInput } from 'sharp';
import type { CommonOptions } from '@/types';

export type NodeInput = SharpInput | Blob | ReadableStream<Uint8Array> | null;

export type NodeOptions = CommonOptions;
