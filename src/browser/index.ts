import type { PixelData } from '@/types';
import type { BrowserInput, BrowserOptions } from '@/browser/types.ts';
import { hasMimeType } from '@/shared/mime.ts';

export async function decode(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<PixelData> {
  if (hasMimeType(options)) {
    console.log('Can use WebCodecs for decoding');
  }
  const decoder = await import('./decoders/canvas');
  return await decoder.decode(input, options);
}
