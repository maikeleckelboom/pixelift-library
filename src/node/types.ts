import type { SharpInput } from 'sharp';
import type { CommonOptions } from '@/types';
import type { Readable } from 'stream';

export type NodeInput = SharpInput | Blob | ReadableStream | Readable | null;

export type NodeOptions = CommonOptions;
