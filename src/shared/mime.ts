import type { PixeliftOptions } from '@/types';

export function hasMimeType(
  options: PixeliftOptions
): options is PixeliftOptions & { mimeType: string } {
  return !!options?.mimeType;
}
