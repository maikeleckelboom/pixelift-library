import { CanvasPool } from '@/browser/decoders/canvas/pool/canvas-pool';
import { normalizeToBrowserInput } from '@/browser/utils/normalize-browser-input.ts';
import { calculateResizeRect } from '@/shared/calculate-resize-rect.ts';
import type { PixelData } from '@/types';
import type { BrowserInput, BrowserOptions } from '@/browser/types';
import {
  CANVAS_IMAGE_SMOOTHING,
  CANVAS_RENDERING_CONTEXT_2D_SETTINGS
} from '@/browser/decoders/canvas/defaults';
import { BrowserDecodeError } from '@/browser/decoders/canvas/errors.ts';
import { validateResizeOptions } from '@/shared/validate.ts';

const canvasPool = new CanvasPool(
  2048,
  2048,
  Math.max(1, navigator.hardwareConcurrency - 1)
);

export async function decode(
  input: BrowserInput,
  options: BrowserOptions = {}
): Promise<PixelData> {
  const opts = options ?? {};

  const pool = opts.pool ?? canvasPool;

  const resize = validateResizeOptions(opts);

  const normalizedSource = await normalizeToBrowserInput(input, {
    formatHint: `image/${opts.formatHint ?? 'png'}`,
    signal: opts.signal
  });

  const imageBitmap = await createImageBitmap(normalizedSource);
  const targetWidth = resize?.width ?? imageBitmap.width;
  const targetHeight = resize?.height ?? imageBitmap.height;

  const canvas = await pool.acquire(opts.signal);

  try {
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d', CANVAS_RENDERING_CONTEXT_2D_SETTINGS);
    if (!context) {
      throw new BrowserDecodeError.ModuleError('CONTEXT_UNAVAILABLE', {
        context: { canvas }
      });
    }

    if (
      resize &&
      (targetWidth !== imageBitmap.width || targetHeight !== imageBitmap.height)
    ) {
      context.imageSmoothingEnabled = CANVAS_IMAGE_SMOOTHING.imageSmoothingEnabled;
      context.imageSmoothingQuality =
        opts.quality ?? CANVAS_IMAGE_SMOOTHING.imageSmoothingQuality;
    }

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
    imageBitmap.close();
    pool.release(canvas);
  }
}
