export type FitMode = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

export interface ResizeOptions {
  width: number;
  height: number;
  fit?: FitMode | undefined;
}

export interface PixelData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface CommonOptions {
  signal?: AbortSignal;
  resize?: ResizeOptions;
}

export type ProgressCallback = (bytesLoaded: number) => void;

export interface ProgressController {
  signal?: AbortSignal | undefined;
  onProgress?: ProgressCallback | undefined;
}
