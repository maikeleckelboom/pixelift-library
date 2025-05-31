import { createErrorModule } from '@/shared/error';

export const BrowserDecodeError = createErrorModule('Decode', {
  INVALID_FORMAT: 'Unsupported image format.',
  DECODE_FAILED: 'Image decoding failed.',
  CONTEXT_UNAVAILABLE: 'Canvas 2D context not available.',
  SVG_RASTERIZATION_FAILED: 'SVG rasterization failed', // todo: impl.
  INVALID_SVG_DOCUMENT: 'Invalid SVG document structure' // todo: impl.
});
