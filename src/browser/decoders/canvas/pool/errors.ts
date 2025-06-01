import { createErrorModule } from '@/shared/error';

export const BrowserPoolErrors = {
  INVALID_MAX_SIZE: 'The `maxSize` must be a positive number.',
  INVALID_DIMENSIONS: 'Canvas width and height must be positive numbers.',
  RELEASE_UNACQUIRED: 'Cannot release a canvas that is not acquired.',
  CREATION_FAILURE: 'Failed to create a new OffscreenCanvas instance.',
  RECREATION_FAILURE: 'Failed to recreate OffscreenCanvas after disposal.',
  QUEUE_FULL: 'Canvas pool queue is full, cannot acquire more canvases.',
  ACQUIRE_TIMEOUT: 'Timed out waiting for a canvas to become available.', // todo: impl.
  POOL_DISPOSED: 'Canvas pool disposed before task could run.',
  POOL_EXHAUSTED: 'Canvas pool exhausted despite size limits',
  OPERATION_ABORTED: new DOMException('Operation aborted', 'AbortError')
} as const;

export const BrowserPoolError = createErrorModule('BrowserPool', BrowserPoolErrors);
