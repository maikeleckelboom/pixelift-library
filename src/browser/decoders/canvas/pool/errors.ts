import { createErrorModule } from '@/shared/error';

export const BrowserPoolErrors = {
  INVALID_MAX_SIZE: 'The `maxSize` must be a positive number.',
  INVALID_DIMENSIONS: 'Canvas width and height must be positive numbers.',
  RELEASE_UNACQUIRED: 'Cannot release a canvas that is not acquired.',
  POOL_DISPOSED: 'Canvas pool disposed before task could run.',
  POOL_EXHAUSTED: 'Canvas pool exhausted despite size limits',
  OPERATION_ABORTED: new DOMException('Operation aborted', 'AbortError')
} as const;

export const BrowserPoolError = createErrorModule('BrowserPool', BrowserPoolErrors);
