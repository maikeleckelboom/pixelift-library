import type { PixeliftOptions } from '@/types';
import type { FitMode, ResizeOptions } from '@/browser/types.ts';

const VALID_FIT_MODES = new Set<FitMode>(['cover', 'contain', 'fill', 'inside', 'outside']);

/**
 * Validates and returns normalized ResizeOptions if present and valid.
 * Throws a descriptive error on invalid input.
 */
export function validateResizeOptions(
  options?: PixeliftOptions
): ResizeOptions | undefined {
  const resize = options?.resize;

  if (!resize) return undefined;

  const { width, height, fit } = resize;

  if (width !== undefined && (!Number.isFinite(width) || width <= 0)) {
    throw new TypeError(
      `Invalid resize width: expected a positive finite number, received ${typeof width} "${width}"`
    );
  }

  if (height !== undefined && (!Number.isFinite(height) || height <= 0)) {
    throw new TypeError(
      `Invalid resize height: expected a positive finite number, received ${typeof height} "${height}"`
    );
  }

  if (fit !== undefined && !VALID_FIT_MODES.has(fit)) {
    throw new RangeError(
      `Invalid fit mode "${fit}". Valid options are: ${Array.from(VALID_FIT_MODES).join(', ')}`
    );
  }

  return { ...resize };
}
