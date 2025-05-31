import { createErrorModule } from '@/shared/error';

export const BrowserDecodeError = createErrorModule('Decode', {
  INVALID_FORMAT: 'Unsupported image format.',
  DECODE_FAILED: 'Image decoding failed.',
  CONTEXT_UNAVAILABLE: 'Canvas 2D context not available.'
});
