import { BROWSER_SUPPORTED_FORMATS, type BrowserMimeType } from '@/shared/formats.ts';

export const BROWSER_SUPPORTED_MIME_TYPES = getSupportedBrowserMimeTypes();

function getSupportedBrowserMimeTypes(): Set<BrowserMimeType | (string & {})> {
  const mimeTypes = new Set<BrowserMimeType>();

  for (const ext of BROWSER_SUPPORTED_FORMATS) {
    mimeTypes.add(`image/${ext}` as BrowserMimeType);
  }

  return mimeTypes;
}
