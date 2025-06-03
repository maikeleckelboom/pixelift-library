import { createErrorModule } from '@/shared/error';

export const BrowserPoolErrors = {
  INVALID_MAX_SIZE: 'The `maxSize` must be a positive number.',
  INVALID_MIN_SIZE: 'The `minSize` must be a non-negative number.',
  INVALID_QUEUE_MAX_SIZE: 'The `queueMaxSize` must be a positive number.',
  INVALID_DIMENSIONS: 'Canvas width and height must be positive numbers.',
  RELEASE_UNACQUIRED: 'Cannot release a canvas that is not acquired.',
  CREATION_FAILURE: 'Failed to create a new OffscreenCanvas instance.',
  RECREATION_FAILURE: 'Failed to recreate OffscreenCanvas after disposal.',
  QUEUE_FULL: 'Canvas pool queue is full, cannot acquire more canvases.',
  QUEUE_EMPTY: 'Canvas pool queue is empty, no canvases available.',
  POOL_DISPOSED: 'Canvas pool disposed before task could run.',
  OPERATION_ABORTED: new DOMException('Operation aborted', 'AbortError')
} as const;

export const BrowserPoolError = createErrorModule('BrowserPool', BrowserPoolErrors);
