const imageDecoderSupportCache = new Map<string, boolean>();

/**
 * Checks whether the WebCodecs `ImageDecoder` can decode the given MIME mimeType at runtime.
 * Uses in-memory cache for performance.
 */
export async function canUseWebCodecs(mimeType: string): Promise<boolean> {
  if (imageDecoderSupportCache.has(mimeType)) {
    return imageDecoderSupportCache.get(mimeType)!;
  }

  if (
    typeof window === 'undefined' ||
    typeof ImageDecoder === 'undefined' ||
    typeof ImageDecoder.isTypeSupported !== 'function'
  ) {
    imageDecoderSupportCache.set(mimeType, false);
    return false;
  }

  try {
    const supported = await ImageDecoder.isTypeSupported(mimeType);
    imageDecoderSupportCache.set(mimeType, supported);
    return supported;
  } catch {
    imageDecoderSupportCache.set(mimeType, false);
    return false;
  }
}
