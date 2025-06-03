import type { BrowserInput, BrowserOptions } from '@/browser/types.ts';
import { isImageBitmapSource } from '@/browser/utils/type-checks.ts';
import { normalizeToBlob } from '@/browser/utils/normalize-to-blob.ts';

/**
 * Normalize heterogeneous binary inputs into a Blob suitable for decoding.
 */
export async function normalizeToBitmapSource(
  input: BrowserInput,
  options: BrowserOptions
): Promise<ImageBitmapSource> {
  if (input == null) {
    throw new TypeError('Input source cannot be null or undefined');
  }

  if (isImageBitmapSource(input)) {
    return input;
  }

  return normalizeToBlob(input, options);
}
