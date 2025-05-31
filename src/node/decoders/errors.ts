import { createErrorModule } from '@/shared/error';

export const NodeDecodeError = createErrorModule('ServerDecode', {
  INVALID_FORMAT: 'Unsupported server image format.',
  DECODE_FAILED: 'Server image decoding failed.',
  FILE_READ_ERROR: 'Failed to read image file.'
});
