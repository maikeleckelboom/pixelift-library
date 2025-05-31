import type { PixelData, PixeliftInput, PixeliftOptions } from '@/types';
import { isBrowser } from '@/shared';
import type { BrowserInput } from '@/browser/types.ts';
import type { NodeInput } from '@/node/types.ts';

export async function decode(
  input: PixeliftInput,
  options?: PixeliftOptions
): Promise<PixelData> {
  if (isBrowser()) {
    const browserDecoder = await import('./browser');
    return browserDecoder.decode(input as BrowserInput, options);
  }

  const nodeDecoder = await import('./node');
  return nodeDecoder.decode(input as NodeInput, options);
}
