import { createErrorModule } from '@/shared/error';

export const BrowserDecodeError = createErrorModule('Decode', {
  INVALID_FORMAT: 'Unsupported image format.',
  DECODE_FAILED: 'Image decoding failed.',
  CONTEXT_UNAVAILABLE: 'Canvas 2D context not available.',
  INVALID_TARGET_DIMENSIONS: 'Invalid target dimensions for decoding.',
  SVG_RASTERIZATION_FAILED: 'SVG rasterization failed'
});
