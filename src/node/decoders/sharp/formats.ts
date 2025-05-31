import sharp from 'sharp';
import { loadSharp } from '@/node/decoders/sharp/load-sharp.ts';
import {
  ALL_FORMATS,
  NODE_SUPPORTED_FORMATS_STATIC,
  type SupportedFormat
} from '@/shared/formats.ts';

/**
 * Get allowed sharp formats synchronously from static import.
 * Use this if you want immediate access (Node.js env only).
 */
export const getAllowedSharpFormatsSync = (): Set<string> => {
  return new Set(
    Object.entries(sharp.format)
      .filter(([, info]) => info.input)
      .map(([key]) => key)
  );
};

/**
 * Runtime detection of supported sharp formats asynchronously.
 * Falls back to a static list on error.
 */
export async function getRuntimeSharpFormats(): Promise<SupportedFormat[]> {
  try {
    const sharp = await loadSharp();

    return Object.entries(sharp.format)
      .filter(([, meta]) => meta.input)
      .map(([format]) => format as SupportedFormat)
      .filter((f) => ALL_FORMATS.includes(f));
  } catch {
    return [...NODE_SUPPORTED_FORMATS_STATIC];
  }
}
