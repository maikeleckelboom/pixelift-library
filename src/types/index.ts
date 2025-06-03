import type { BrowserInput, BrowserOptions } from '@/browser/types';
import type { NodeInput, NodeOptions } from '@/node/types';

export interface PixelData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export type PixeliftInput = BrowserInput | NodeInput;

export type PixeliftOptions = BrowserOptions | NodeOptions;
