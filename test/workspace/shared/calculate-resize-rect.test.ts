import {
  calculateResizeRect,
  type ResizeRect
} from '@/browser/utils/calculate-resize-rect.ts';

const createRect = (
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number
): ResizeRect => ({ sx, sy, sw, sh, dx, dy, dw, dh });

describe('calculateResizeRect', () => {
  describe('cover mode (default)', () => {
    it('should crop horizontally when source is wider than target aspect ratio', () => {
      const result = calculateResizeRect(1000, 500, { width: 400, height: 400 });

      expect(result).toEqual(createRect(250, 0, 500, 500, 0, 0, 400, 400));
    });

    it('should crop vertically when source is taller than target aspect ratio', () => {
      const result = calculateResizeRect(500, 1000, { width: 400, height: 400 });

      expect(result).toEqual(createRect(0, 250, 500, 500, 0, 0, 400, 400));
    });

    it('should handle exact aspect ratio match', () => {
      const result = calculateResizeRect(800, 600, { width: 400, height: 300 });

      expect(result).toEqual(createRect(0, 0, 800, 600, 0, 0, 400, 300));
    });
  });

  describe('contain mode', () => {
    it('should letterbox when source is wider than target aspect ratio', () => {
      const result = calculateResizeRect(1000, 500, {
        width: 400,
        height: 400,
        fit: 'contain'
      });

      expect(result).toEqual(createRect(0, 0, 1000, 500, 0, 100, 400, 200));
    });

    it('should pillarbox when source is taller than target aspect ratio', () => {
      const result = calculateResizeRect(500, 1000, {
        width: 400,
        height: 400,
        fit: 'contain'
      });

      expect(result).toEqual(createRect(0, 0, 500, 1000, 100, 0, 200, 400));
    });

    it('should handle exact aspect ratio match', () => {
      const result = calculateResizeRect(800, 600, {
        width: 400,
        height: 300,
        fit: 'contain'
      });

      expect(result).toEqual(createRect(0, 0, 800, 600, 0, 0, 400, 300));
    });
  });

  describe('inside mode', () => {
    it('should not resize when source is smaller than target', () => {
      const result = calculateResizeRect(300, 200, {
        width: 400,
        height: 400,
        fit: 'inside'
      });

      expect(result).toEqual(createRect(0, 0, 300, 200, 50, 100, 300, 200));
    });

    it('should resize when source is larger than target', () => {
      const result = calculateResizeRect(1000, 500, {
        width: 400,
        height: 400,
        fit: 'inside'
      });

      expect(result).toEqual(createRect(0, 0, 1000, 500, 0, 100, 400, 200));
    });

    it('should not resize when one dimension is smaller', () => {
      const result = calculateResizeRect(300, 800, {
        width: 400,
        height: 400,
        fit: 'inside'
      });

      expect(result).toEqual(createRect(0, 0, 300, 800, 125, 0, 150, 400));
    });
  });

  describe('outside mode', () => {
    it('should behave like cover mode', () => {
      const coverResult = calculateResizeRect(1000, 500, {
        width: 400,
        height: 400,
        fit: 'cover'
      });
      const outsideResult = calculateResizeRect(1000, 500, {
        width: 400,
        height: 400,
        fit: 'outside'
      });

      expect(outsideResult).toEqual(coverResult);
    });
  });

  describe('fill mode', () => {
    it('should stretch to fill target dimensions', () => {
      const result = calculateResizeRect(800, 600, {
        width: 400,
        height: 200,
        fit: 'fill'
      });

      expect(result).toEqual(createRect(0, 0, 800, 600, 0, 0, 400, 200));
    });
  });

  describe('edge cases', () => {
    it('should handle square source and target', () => {
      const result = calculateResizeRect(100, 100, { width: 50, height: 50 });

      expect(result).toEqual(createRect(0, 0, 100, 100, 0, 0, 50, 50));
    });

    it('should handle very thin source image', () => {
      const result = calculateResizeRect(2000, 10, {
        width: 400,
        height: 400,
        fit: 'cover'
      });

      expect(result).toEqual(createRect(995, 0, 10, 10, 0, 0, 400, 400));
    });

    it('should handle very tall source image', () => {
      const result = calculateResizeRect(10, 2000, {
        width: 400,
        height: 400,
        fit: 'cover'
      });

      expect(result).toEqual(createRect(0, 995, 10, 10, 0, 0, 400, 400));
    });

    it('should handle rounding for odd dimensions', () => {
      const result = calculateResizeRect(333, 333, {
        width: 100,
        height: 100,
        fit: 'contain'
      });

      expect(result).toEqual(createRect(0, 0, 333, 333, 0, 0, 100, 100));
    });

    it('should handle asymmetric target dimensions', () => {
      const result = calculateResizeRect(1000, 1000, {
        width: 200,
        height: 100,
        fit: 'contain'
      });

      expect(result).toEqual(createRect(0, 0, 1000, 1000, 50, 0, 100, 100));
    });

    it('should default to cover mode when fit is not specified', () => {
      const withoutFit = calculateResizeRect(1000, 500, { width: 400, height: 400 });
      const withCover = calculateResizeRect(1000, 500, {
        width: 400,
        height: 400,
        fit: 'cover'
      });

      expect(withoutFit).toEqual(withCover);
    });
  });

  describe('mathematical precision', () => {
    it('should handle fractional aspect ratios correctly', () => {
      const result = calculateResizeRect(1920, 1080, {
        width: 800,
        height: 600,
        fit: 'cover'
      });

      const expectedCropWidth = Math.round(1080 * (800 / 600)); // 1440
      const expectedSx = Math.round((1920 - expectedCropWidth) / 2); // 240

      expect(result).toEqual(
        createRect(expectedSx, 0, expectedCropWidth, 1080, 0, 0, 800, 600)
      );
    });

    it('should maintain precision with large numbers', () => {
      const result = calculateResizeRect(4000, 3000, {
        width: 1920,
        height: 1080,
        fit: 'contain'
      });

      expect(result).toEqual(createRect(0, 0, 4000, 3000, 240, 0, 1440, 1080));
    });
  });

  describe('optional target dimensions', () => {
    it('should derive height from width and source aspect ratio if height is undefined', () => {
      const result = calculateResizeRect(1000, 500, { width: 400 });
      expect(result).toEqual(createRect(0, 0, 1000, 500, 0, 0, 400, 200));
    });

    it('should derive width from height and source aspect ratio if width is undefined', () => {
      const result = calculateResizeRect(1000, 500, { height: 100 });
      expect(result).toEqual(createRect(0, 0, 1000, 500, 0, 0, 200, 100));
    });

    it('should use source dimensions if both target width and height are undefined', () => {
      const result = calculateResizeRect(1000, 500, {});
      expect(result).toEqual(createRect(0, 0, 1000, 500, 0, 0, 1000, 500));
    });

    it('should derive height and apply contain fit correctly when only width is provided', () => {
      const result = calculateResizeRect(1000, 800, { width: 500, fit: 'contain' });
      expect(result).toEqual(createRect(0, 0, 1000, 800, 0, 0, 500, 400));
    });

    it('should derive width and apply cover fit correctly when only height is provided', () => {
      const result = calculateResizeRect(1000, 500, { height: 400, fit: 'cover' });
      expect(result).toEqual(createRect(0, 0, 1000, 500, 0, 0, 800, 400));
    });
  });
});
