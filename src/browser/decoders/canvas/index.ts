import { CanvasPool } from '@/browser/decoders/canvas/pool/canvas-pool';
import { normalizeToBitmapSource } from '@/browser/utils/normalize-to-bitmap-source.ts';
import { calculateResizeRect } from '@/browser/utils/calculate-resize-rect.ts';
import type { PixelData } from '@/types';
import type { BrowserInput, BrowserOptions } from '@/browser/types';
import { CANVAS_DECODE_CONFIG } from '@/browser/decoders/canvas/defaults';
import { BrowserDecodeError } from '@/browser/decoders/canvas/errors.ts';
import { validateResizeOptions } from '@/shared/validate.ts';

const canvasPool = new CanvasPool(
  2048,
  2048,
  Math.min(Math.max(2, Math.floor(navigator.hardwareConcurrency * 0.5)), 6)
);

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
  const opts = options ?? {};
  const pool = opts.pool ?? canvasPool;

  const resize = validateResizeOptions(opts);

  const normalizedSource = await normalizeToBitmapSource(input, {
    formatHint: opts.formatHint,
    signal: opts.signal
  });

  const imageBitmap = await createImageBitmap(
    normalizedSource,
    CANVAS_DECODE_CONFIG.bitmap
  );

  const targetWidth = resize?.width ?? imageBitmap.width;
  const targetHeight = resize?.height ?? imageBitmap.height;

  if (targetWidth <= 0 || targetHeight <= 0) {
    throw new BrowserDecodeError.ModuleError('INVALID_TARGET_DIMENSIONS', {
      context: { targetWidth, targetHeight }
    });
  }

  const canvas = await pool.acquire(opts.signal);

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
      opts.quality ?? CANVAS_DECODE_CONFIG.smoothing.imageSmoothingQuality;

    const { sx, sy, sw, sh, dx, dy, dw, dh } = calculateResizeRect(
      imageBitmap.width,
      imageBitmap.height,
      {
        width: targetWidth,
        height: targetHeight,
        fit: resize?.fit
      }
    );

    context.drawImage(imageBitmap, sx, sy, sw, sh, dx, dy, dw, dh);

    const imageData = context.getImageData(0, 0, targetWidth, targetHeight);

    return {
      data: imageData.data,
      width: targetWidth,
      height: targetHeight
    };
  } finally {
    if (imageBitmap) {
      imageBitmap.close();
    }
    pool.release(canvas);
  }
}
