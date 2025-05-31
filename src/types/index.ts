import type { BrowserInput, BrowserOptions } from '@/browser/types.ts';
import type { NodeInput, NodeOptions } from '@/node/types.ts';

export type FitMode = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

export interface PixelData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: FitMode | undefined;
}

export interface CommonOptions {
  signal?: AbortSignal;
  resize?: ResizeOptions;
}

export type ProgressCallback = (loaded: number) => void;

export interface ProgressOptions {
  signal?: AbortSignal | undefined;
  onProgress?: ProgressCallback | undefined;
}

export type PixeliftInput = BrowserInput | NodeInput;

export type PixeliftOptions = BrowserOptions | NodeOptions;
