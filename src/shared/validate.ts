import type { CommonOptions } from '@/types';

export function validateResizeOptions(options?: CommonOptions): CommonOptions['resize'] {
  const resize = options?.resize;
  if (!resize) return undefined;

  const { width, height, fit } = resize;

  const isWidthValid = width == null || (Number.isFinite(width) && width > 0);
  const isHeightValid = height == null || (Number.isFinite(height) && height > 0);

  if (!isWidthValid || !isHeightValid) {
    throw new Error('Resize dimensions must be positive numbers or undefined');
  }

  if (fit && !['cover', 'contain', 'fill', 'inside', 'outside'].includes(fit)) {
    throw new Error(`Invalid fit mode: ${fit}`);
  }

  return {
    ...(width != null && { width }),
    ...(height != null && { height }),
    fit
  };
}
