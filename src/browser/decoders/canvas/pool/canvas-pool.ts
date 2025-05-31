import { BrowserPoolError, BrowserPoolErrors } from '@/browser/decoders/canvas/pool/errors';
import type { Pool, Task } from '@/browser/decoders/canvas/pool/types';

export class CanvasPool implements Pool {
  private pool: OffscreenCanvas[] = [];
  private allocatedCanvases = new Set<OffscreenCanvas>();
  private queuedTasks: Task[] = [];

  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly maxSize: number = 4
  ) {
    if (maxSize <= 0) throw new BrowserPoolError.ModuleError('INVALID_MAX_SIZE');
    if (width <= 0 || height <= 0)
      throw new BrowserPoolError.ModuleError('INVALID_DIMENSIONS');
  }

  acquire(signal?: AbortSignal): Promise<OffscreenCanvas> {
    if (signal?.aborted) {
      return Promise.reject(BrowserPoolErrors.OPERATION_ABORTED);
    }

    const available = this.pool.find((canvas) => !this.allocatedCanvases.has(canvas));
    if (available) {
      this.allocatedCanvases.add(available);
      return Promise.resolve(available);
    }

    if (this.pool.length < this.maxSize) {
      const canvas = new OffscreenCanvas(this.width, this.height);
      this.pool.push(canvas);
      this.allocatedCanvases.add(canvas);
      return Promise.resolve(canvas);
    }

    return new Promise((resolve, reject) => {
      const task: Task = { resolve, reject, signal };

      const onAbort = () => {
        const idx = this.queuedTasks.indexOf(task);
        if (idx !== -1) {
          this.queuedTasks.splice(idx, 1);
          reject(BrowserPoolErrors.OPERATION_ABORTED);
        }
      };

      signal?.addEventListener('abort', onAbort, { once: true });

      this.queuedTasks.push(task);

      const cleanup = () => signal?.removeEventListener('abort', onAbort);

      task.resolve = (canvas) => {
        cleanup();
        resolve(canvas);
      };

      task.reject = (error) => {
        cleanup();
        reject(error);
      };
    });
  }

  release(canvas: OffscreenCanvas): void {
    if (!this.allocatedCanvases.has(canvas)) {
      throw new BrowserPoolError.ModuleError('RELEASE_UNACQUIRED');
    }

    this.allocatedCanvases.delete(canvas);

    while (this.queuedTasks.length) {
      const task = this.queuedTasks.shift()!;
      if (task.signal?.aborted) {
        task.reject(BrowserPoolErrors.OPERATION_ABORTED);
        continue;
      }

      this.allocatedCanvases.add(canvas);
      task.resolve(canvas);
      return;
    }
  }

  dispose(): void {
    this.pool = [];
    this.allocatedCanvases.clear();

    this.queuedTasks.forEach((task) =>
      task.reject(new BrowserPoolError.ModuleError('POOL_DISPOSED'))
    );
    this.queuedTasks = [];
  }
}
