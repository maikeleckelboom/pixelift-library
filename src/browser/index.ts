import type { PixelData } from '@/types';
import type { BrowserInput, BrowserOptions } from '@/browser/types.ts';

export async function decode(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<PixelData> {
  const decoder = await import('./decoders/canvas');
  return await decoder.decode(input, options);
}
