import { BrowserPoolError, BrowserPoolErrors } from '@/browser/decoders/canvas/pool/errors';
import type { Pool, Task } from '@/browser/decoders/canvas/pool/types';

interface TaskNode {
  task: Task;
  next: TaskNode | null;
  cleanup: () => void;
}

export class OffscreenCanvasPool implements Pool {
  private pool: OffscreenCanvas[] = [];
  private allocatedCanvases = new Set<OffscreenCanvas>();
  private queuedTasksHead: TaskNode | null = null;
  private queuedTasksTail: TaskNode | null = null;
  private currentQueueSizeInternal: number = 0;
  private readonly queueMaxSize: number;
  private isDisposed = false;

  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly maxSize: number = 4,
    queueMaxSizeParam: number = 100
  ) {
    if (maxSize <= 0) {
      throw new BrowserPoolError.ModuleError('INVALID_MAX_SIZE');
    }

    if (width <= 0 || height <= 0) {
      throw new BrowserPoolError.ModuleError('INVALID_DIMENSIONS');
    }

    if (queueMaxSizeParam <= 0) {
      throw new BrowserPoolError.ModuleError('INVALID_QUEUE_MAX_SIZE');
    }

    this.queueMaxSize = queueMaxSizeParam;
  }

  public acquire(signal?: AbortSignal): Promise<OffscreenCanvas> {
    if (this.isDisposed) {
      return Promise.reject(new BrowserPoolError.ModuleError('POOL_DISPOSED'));
    }

    if (signal?.aborted) {
      return Promise.reject(BrowserPoolErrors.OPERATION_ABORTED);
    }

    const available = this.pool.find((canvas) => !this.allocatedCanvases.has(canvas));
    if (available) {
      this.allocatedCanvases.add(available);
      return Promise.resolve(available);
    }

    if (this.pool.length < this.maxSize) {
      try {
        const canvas = new OffscreenCanvas(this.width, this.height);
        this.pool.push(canvas);
        this.allocatedCanvases.add(canvas);
        return Promise.resolve(canvas);
      } catch (error) {
        return Promise.reject(
          new BrowserPoolError.ModuleError('CREATION_FAILURE', { cause: error })
        );
      }
    }

    return new Promise<OffscreenCanvas>((resolve, reject) => {
      const node: TaskNode = {
        task: { resolve, reject, signal },
        next: null,
        cleanup: () => {}
      };

      const onAbort = () => {
        this.removeNode(node);
        reject(BrowserPoolErrors.OPERATION_ABORTED);
      };

      node.cleanup = () => {
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
      };

      if (this.currentQueueSizeInternal >= this.queueMaxSize) {
        node.cleanup();
        reject(new BrowserPoolError.ModuleError('QUEUE_FULL'));
        return;
      }

      this.enqueueNode(node);

      if (signal?.aborted) {
        onAbort();
      } else if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }
    });
  }

  public release(canvas: OffscreenCanvas): void {
    if (this.isDisposed) {
      this.destroyCanvasResources(canvas);
      return;
    }

    if (!this.allocatedCanvases.has(canvas)) {
      if (this.pool.includes(canvas)) return;
      throw new BrowserPoolError.ModuleError('RELEASE_UNACQUIRED');
    }

    this.allocatedCanvases.delete(canvas);

    let canvasToOffer: OffscreenCanvas | null = canvas;
    let recreationErrorCause: Error | undefined = undefined;

    if (canvas.width !== this.width || canvas.height !== this.height) {
      this.destroyCanvasResources(canvas);
      this.pool = this.pool.filter((c) => c !== canvas);

      try {
        const newCanvas = new OffscreenCanvas(this.width, this.height);
        this.pool.push(newCanvas);
        canvasToOffer = newCanvas;
      } catch (error) {
        canvasToOffer = null;
        recreationErrorCause = error instanceof Error ? error : new Error(String(error));
      }
    }

    let nextTaskNode: TaskNode | null;
    while ((nextTaskNode = this.dequeueHead()) !== null) {
      const currentNode = nextTaskNode;
      currentNode.cleanup();

      const { resolve, reject, signal: taskSignal } = currentNode.task;

      // Skip aborted tasks
      if (taskSignal?.aborted) {
        reject(BrowserPoolErrors.OPERATION_ABORTED);
        continue;
      }

      if (canvasToOffer) {
        this.allocatedCanvases.add(canvasToOffer);
        resolve(canvasToOffer);
        return;
      } else {
        reject(
          new BrowserPoolError.ModuleError('RECREATION_FAILURE', {
            cause: recreationErrorCause
          })
        );
        return;
      }
    }
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    // Clear all canvas resources
    this.pool.forEach((canvas) => this.destroyCanvasResources(canvas));
    this.pool = [];
    this.allocatedCanvases.clear();

    // Reject all pending tasks
    let current = this.queuedTasksHead;
    this.queuedTasksHead = null;
    this.queuedTasksTail = null;
    this.currentQueueSizeInternal = 0;

    while (current) {
      const nextNode = current.next;
      current.cleanup();
      current.task.reject(new BrowserPoolError.ModuleError('POOL_DISPOSED'));
      current.next = null;
      current = nextNode;
    }
  }

  private enqueueNode(node: TaskNode): void {
    if (this.queuedTasksTail) {
      this.queuedTasksTail.next = node;
      this.queuedTasksTail = node;
    } else {
      this.queuedTasksHead = node;
      this.queuedTasksTail = node;
    }
    this.currentQueueSizeInternal++;
  }

  private dequeueHead(): TaskNode | null {
    if (!this.queuedTasksHead) return null;
    const popped = this.queuedTasksHead;
    this.queuedTasksHead = popped.next;
    if (!this.queuedTasksHead) {
      this.queuedTasksTail = null;
    }
    this.currentQueueSizeInternal--;
    popped.next = null;
    return popped;
  }

  private removeNode(target: TaskNode): void {
    if (!this.queuedTasksHead) return;

    let prev: TaskNode | null = null;
    let curr: TaskNode | null = this.queuedTasksHead;
    while (curr) {
      if (curr === target) {
        if (prev) {
          prev.next = curr.next;
        } else {
          this.queuedTasksHead = curr.next;
        }
        if (curr === this.queuedTasksTail) {
          this.queuedTasksTail = prev;
        }
        curr.cleanup();
        this.currentQueueSizeInternal--;
        return;
      }
      prev = curr;
      curr = curr.next;
    }
  }

  private destroyCanvasResources(canvas: OffscreenCanvas): void {
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Release bitmap memory
      canvas.width = 1;
      canvas.height = 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`OffscreenCanvasPool: Failed to tear down canvas: ${msg}`);
    }
  }
}
