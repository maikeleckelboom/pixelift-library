import { CanvasPool } from '@/browser/decoders/canvas/pool/canvas-pool';
import { normalizeToBrowserInput } from '@/browser/utils/normalize-browser-input.ts';
import { calculateResizeRect } from '@/shared/calculate-resize-rect.ts';
import type { PixelData } from '@/types';
import type { Pool } from '@/browser/decoders/canvas/pool/types';
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
  source: BrowserInput,
  optionsOrPool?: BrowserOptions | Pool,
  maybeOptions?: BrowserOptions
): Promise<PixelData> {
  const [pool, options] = hasPool(optionsOrPool)
    ? [optionsOrPool, maybeOptions]
    : [canvasPool, optionsOrPool];

  const resize = validateResizeOptions(options);

  const normalizedSource = await normalizeToBrowserInput(source, {
    formatHint: `image/${options?.formatHint ?? 'png'}`,
    signal: options?.signal
  });

  const imageBitmap = await createImageBitmap(normalizedSource);
  const targetWidth = resize?.width ?? imageBitmap.width;
  const targetHeight = resize?.height ?? imageBitmap.height;

  const canvas = await pool.acquire(options?.signal);

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
        options?.quality ?? CANVAS_IMAGE_SMOOTHING.imageSmoothingQuality;
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

export function hasPool(input: unknown): input is Pool {
  return !!input && typeof input === 'object' && 'acquire' in input && 'release' in input;
}
