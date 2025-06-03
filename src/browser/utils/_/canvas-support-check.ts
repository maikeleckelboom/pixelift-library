const BASE64_IMAGE =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

const decodeSupportCache = new Map<string, boolean>();

export async function canUseOffscreenCanvas(mimeType: string): Promise<boolean> {
  if (decodeSupportCache.has(mimeType)) {
    return decodeSupportCache.get(mimeType)!;
  }

  try {
    const binary = atob(BASE64_IMAGE);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mimeType });
    const bitmap = await createImageBitmap(blob);
    bitmap.close();

    decodeSupportCache.set(mimeType, true);
    return true;
  } catch {
    decodeSupportCache.set(mimeType, false);
    return false;
  }
}
