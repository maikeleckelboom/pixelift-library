import type { CommonOptions } from '@/types';

export function validateResizeOptions(options?: CommonOptions): CommonOptions['resize'] {
  if (!options?.resize) return undefined;

  const { width, height, fit } = options.resize;

  if (width <= 0 || height <= 0) {
    throw new Error('Resize dimensions must be positive integers');
  }

  if (fit && !['cover', 'contain', 'fill', 'inside', 'outside'].includes(fit)) {
    throw new Error(`Invalid fit mode: ${fit}`);
  }

  return { width, height, fit };
}
