import type { ResizeOptions } from '@/types';

export interface ResizeRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

export function calculateResizeRect(
  srcWidth: number,
  srcHeight: number,
  { width, height, fit = 'cover' }: ResizeOptions
): ResizeRect {
  const srcAspect = srcWidth / srcHeight;

  let targetW = width;
  let targetH = height;

  if (targetW == null && targetH == null) {
    targetW = srcWidth;
    targetH = srcHeight;
  } else if (targetW != null && targetH == null) {
    targetH = Math.round(targetW / srcAspect);
  } else if (targetH != null && targetW == null) {
    targetW = Math.round(targetH * srcAspect);
  }

  if (targetW == null || targetH == null) {
    throw new Error('Internal error: target width/height still undefined');
  }

  const finalW = targetW;
  const finalH = targetH;

  const targetAspect = finalW / finalH;

  let sx = 0,
    sy = 0,
    sw = srcWidth,
    sh = srcHeight;
  let dw = finalW;
  let dh = finalH;

  switch (fit) {
    case 'contain':
    case 'inside': {
      const shouldSkipResizeForInside =
        fit === 'inside' && srcWidth <= finalW && srcHeight <= finalH;

      if (shouldSkipResizeForInside) {
        dw = srcWidth;
        dh = srcHeight;
      } else {
        if (srcAspect > targetAspect) {
          dh = Math.round(finalW / srcAspect);
        } else {
          dw = Math.round(finalH * srcAspect);
        }
      }
      break;
    }

    case 'cover':
    case 'outside': {
      if (srcAspect > targetAspect) {
        sh = srcHeight;
        sw = Math.round(sh * targetAspect);
        sx = Math.round((srcWidth - sw) / 2);
      } else {
        sw = srcWidth;
        sh = Math.round(sw / targetAspect);
        sy = Math.round((srcHeight - sh) / 2);
      }
      dw = finalW;
      dh = finalH;
      break;
    }

    case 'fill':
    default:
      dw = finalW;
      dh = finalH;
      break;
  }

  const dx = Math.round((finalW - dw) / 2);
  const dy = Math.round((finalH - dh) / 2);

  return { sx, sy, sw, sh, dx, dy, dw, dh };
}
