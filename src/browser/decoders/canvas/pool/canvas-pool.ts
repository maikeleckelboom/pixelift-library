import { BrowserPoolError, BrowserPoolErrors } from '@/browser/decoders/canvas/pool/errors';
import type { Pool, Task } from '@/browser/decoders/canvas/pool/types';

interface TaskNode {
  task: Task;
  next: TaskNode | null;
  cleanup: () => void;
}

export class CanvasPool implements Pool {
  private pool: OffscreenCanvas[] = [];
  private allocatedCanvases = new Set<OffscreenCanvas>();
  private queuedTasksHead: TaskNode | null = null;
  private queuedTasksTail: TaskNode | null = null;
  private readonly queueMaxSize: number;

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
      const onAbort = () => {
        this.removeNode(node);
        reject(BrowserPoolErrors.OPERATION_ABORTED);
      };

      const node: TaskNode = {
        task: { resolve, reject, signal },
        next: null,
        cleanup: () => signal?.removeEventListener('abort', onAbort)
      };

      // Queue size enforcement (CRITICAL)
      if (this.getCurrentQueueSize() >= this.queueMaxSize) {
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

  release(canvas: OffscreenCanvas): void {
    if (!this.allocatedCanvases.has(canvas)) {
      throw new BrowserPoolError.ModuleError('RELEASE_UNACQUIRED');
    }

    if (canvas.width !== this.width || canvas.height !== this.height) {
      this.destroyCanvasResources(canvas); // CRITICAL: Prevent leaks
      this.pool = this.pool.filter((c) => c !== canvas);
      this.allocatedCanvases.delete(canvas);

      try {
        const newCanvas = new OffscreenCanvas(this.width, this.height);
        this.pool.push(newCanvas);
        canvas = newCanvas;
      } catch (error) {
        throw new BrowserPoolError.ModuleError('RECREATION_FAILURE', { cause: error });
      }
    }

    this.allocatedCanvases.delete(canvas);

    while (this.queuedTasksHead) {
      const node = this.queuedTasksHead;
      this.dequeueHead();
      node.cleanup();

      if (node.task.signal?.aborted) {
        node.task.reject(BrowserPoolErrors.OPERATION_ABORTED);
        continue;
      }

      this.allocatedCanvases.add(canvas);
      node.task.resolve(canvas);
      return;
    }
  }

  dispose(): void {
    // Destroy all canvas resources (CRITICAL)
    this.pool.forEach((canvas) => this.destroyCanvasResources(canvas));
    this.pool = [];
    this.allocatedCanvases.clear();

    let currentNode = this.queuedTasksHead;
    this.queuedTasksHead = null;
    this.queuedTasksTail = null;

    while (currentNode) {
      const nextNode = currentNode.next;
      currentNode.cleanup();
      currentNode.task.reject(new BrowserPoolError.ModuleError('POOL_DISPOSED'));
      currentNode = nextNode;
    }
  }

  private getCurrentQueueSize(): number {
    let count = 0;
    let node = this.queuedTasksHead;
    while (node) {
      count++;
      node = node.next;
    }
    return count;
  }

  private enqueueNode(node: TaskNode): void {
    if (this.queuedTasksTail) {
      this.queuedTasksTail.next = node;
      this.queuedTasksTail = node;
    } else {
      this.queuedTasksHead = node;
      this.queuedTasksTail = node;
    }
  }

  private dequeueHead(): void {
    if (!this.queuedTasksHead) return;
    this.queuedTasksHead = this.queuedTasksHead.next;
    if (!this.queuedTasksHead) {
      this.queuedTasksTail = null;
    }
  }

  private removeNode(target: TaskNode): void {
    target.cleanup();

    if (!this.queuedTasksHead) return;

    if (this.queuedTasksHead === target) {
      this.dequeueHead();
      return;
    }

    let prev = this.queuedTasksHead;
    while (prev.next && prev.next !== target) {
      prev = prev.next;
    }

    if (prev.next === target) {
      prev.next = target.next;
      if (target === this.queuedTasksTail) {
        this.queuedTasksTail = prev;
      }
    }
  }

  // Minimal resource cleanup (CRITICAL)
  private destroyCanvasResources(canvas: OffscreenCanvas): void {
    try {
      // Most effective cross-browser cleanup
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      // Resetting canvas size helps GC (Garbage Collector)
      canvas.width = 1;
      canvas.height = 1;
    } catch {}
  }
}
