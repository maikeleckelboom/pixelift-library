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
  private maxQueue = 100;

  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly maxSize: number = 4
  ) {
    if (maxSize <= 0) {
      throw new BrowserPoolError.ModuleError('INVALID_MAX_SIZE');
    }
    if (width <= 0 || height <= 0) {
      throw new BrowserPoolError.ModuleError('INVALID_DIMENSIONS');
    }
  }

  acquire(signal?: AbortSignal): Promise<OffscreenCanvas> {
    if (signal?.aborted) {
      return Promise.reject(BrowserPoolErrors.OPERATION_ABORTED);
    }

    // Try to find any existing, free canvas in the pool.
    const available = this.pool.find((canvas) => !this.allocatedCanvases.has(canvas));
    if (available) {
      this.allocatedCanvases.add(available);
      return Promise.resolve(available);
    }

    // If we have not yet reached maxSize, create a brand-new canvas.
    if (this.pool.length < this.maxSize) {
      const canvas = new OffscreenCanvas(this.width, this.height);
      this.pool.push(canvas);
      this.allocatedCanvases.add(canvas);
      return Promise.resolve(canvas);
    }

    // Otherwise, the pool is "full" → enqueue this request.
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

      this.enqueueNode(node);

      if (signal) {
        if (signal.aborted) {
          // Handle immediate abort after enqueue
          this.removeNode(node);
          reject(BrowserPoolErrors.OPERATION_ABORTED);
        } else {
          signal.addEventListener('abort', onAbort, { once: true });
        }
      }
    });
  }

  release(canvas: OffscreenCanvas): void {
    if (!this.allocatedCanvases.has(canvas)) {
      throw new BrowserPoolError.ModuleError('RELEASE_UNACQUIRED');
    }

    if (canvas.width !== this.width || canvas.height !== this.height) {
      this.pool = this.pool.filter((c) => c !== canvas);
      this.allocatedCanvases.delete(canvas);

      const newCanvas = new OffscreenCanvas(this.width, this.height);
      this.pool.push(newCanvas);
      canvas = newCanvas;
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

  private enqueueNode(node: TaskNode): void {
    // if (this.queueSize >= this.maxQueue) {
    //   node.cleanup();
    //   node.task.reject(BrowserPoolErrors.QUEUE_FULL);
    //   return;
    // }
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
}
