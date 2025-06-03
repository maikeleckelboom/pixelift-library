import { normalizeToBitmapSource } from '@/browser/utils/normalize-to-bitmap-source.ts';
import { calculateResizeRect } from '@/browser/utils/calculate-resize-rect.ts';
import type { PixelData } from '@/types';
import type { BrowserInput, BrowserOptions } from '@/browser/types';
import { CANVAS_DECODE_CONFIG } from '@/browser/decoders/canvas/defaults';
import { BrowserDecodeError } from '@/browser/decoders/canvas/errors.ts';
import { validateResizeOptions } from '@/shared/validate.ts';
import { getInternalCanvasPool } from '@/browser/decoders/canvas/internal-canvas-pool.ts';

/**
 * Decodes image data into raw pixel data
 *
 * @param input - Image source (Buffer, Blob, Stream, etc.)
 * @param options - Decoding/resize options
 * @returns Promise resolving to PixelData
 *
 * @example
 * const pixels = await decode(fs.readFileSync('image.jpg'), {
 *   resize: { width: 300, height: 200 }
 * });
 */
export async function decode(
  input: BrowserInput,
  options: BrowserOptions = {}
): Promise<PixelData> {
  const resize = validateResizeOptions(options);

  const normalizedSource = await normalizeToBitmapSource(input, options);

  const imageBitmap = await createImageBitmap(
    normalizedSource,
    CANVAS_DECODE_CONFIG.bitmap
  );

  const targetWidth = resize?.width ?? imageBitmap.width;
  const targetHeight = resize?.height ?? imageBitmap.height;

  const pool = getInternalCanvasPool();

  const canvas = await pool.acquire(options.signal);

  try {
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d', CANVAS_DECODE_CONFIG.context2d);

    if (!context) {
      throw new BrowserDecodeError.ModuleError('CONTEXT_UNAVAILABLE', {
        context: { canvas }
      });
    }

    context.imageSmoothingEnabled = CANVAS_DECODE_CONFIG.smoothing.imageSmoothingEnabled;
    context.imageSmoothingQuality =
      options.quality ?? CANVAS_DECODE_CONFIG.smoothing.imageSmoothingQuality;

    const { sx, sy, sw, sh, dx, dy, dw, dh } = calculateResizeRect(
      imageBitmap.width,
      imageBitmap.height,
      resize
    );

    context.drawImage(imageBitmap, sx, sy, sw, sh, dx, dy, dw, dh);

    const imageData = context.getImageData(0, 0, targetWidth, targetHeight);

    return {
      data: imageData.data,
      width: targetWidth,
      height: targetHeight
    };
  } finally {
    imageBitmap.close();
    pool.release(canvas);
  }
}
