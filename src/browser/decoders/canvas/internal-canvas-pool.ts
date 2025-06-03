import { OffscreenCanvasPool } from '@/browser/decoders/canvas/pool/offscreen-canvas-pool.ts';

let internalCanvasPool: OffscreenCanvasPool | null = null;

export function getInternalCanvasPool(): OffscreenCanvasPool {
  internalCanvasPool ??= new OffscreenCanvasPool(
    2048,
    2048,
    Math.round(navigator.hardwareConcurrency * 0.5)
  );

  return internalCanvasPool;
}
